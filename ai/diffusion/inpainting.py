"""
MediVision AI - Counterfactual Inpainting with Diffusion Models

DDPM-based inpainting module for creating counterfactual explanations
in medical imaging. Removes suspected lesions to verify model sensitivity.

Key Features:
- Guided inpainting with attention to healthy tissue
- Sensitivity analysis for explainability
- Uncertainty quantification
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional, Tuple, Callable
import numpy as np
from dataclasses import dataclass
import math


@dataclass
class DiffusionConfig:
    """Configuration for diffusion model."""
    img_size: int = 256
    img_channels: int = 1
    timesteps: int = 1000
    beta_start: float = 0.0001
    beta_end: float = 0.02
    beta_schedule: str = "linear"  # linear, cosine, quadratic
    model_channels: int = 64
    num_res_blocks: int = 2
    attention_resolutions: Tuple[int, ...] = (32, 16, 8)
    dropout: float = 0.0


def get_beta_schedule(
    schedule: str,
    timesteps: int,
    beta_start: float,
    beta_end: float,
) -> torch.Tensor:
    """Get noise schedule."""
    if schedule == "linear":
        return torch.linspace(beta_start, beta_end, timesteps)
    elif schedule == "cosine":
        # Cosine schedule from improved DDPM
        steps = timesteps + 1
        s = 0.008
        t = torch.linspace(0, timesteps, steps)
        alphas_cumprod = torch.cos((t / timesteps + s) / (1 + s) * math.pi / 2) ** 2
        alphas_cumprod = alphas_cumprod / alphas_cumprod[0]
        betas = 1 - alphas_cumprod[1:] / alphas_cumprod[:-1]
        return torch.clamp(betas, 0.0001, 0.999)
    elif schedule == "quadratic":
        return torch.linspace(beta_start ** 0.5, beta_end ** 0.5, timesteps) ** 2
    else:
        raise ValueError(f"Unknown schedule: {schedule}")


class SinusoidalPositionEmbedding(nn.Module):
    """Sinusoidal positional embedding for timestep."""
    
    def __init__(self, dim: int):
        super().__init__()
        self.dim = dim
    
    def forward(self, t: torch.Tensor) -> torch.Tensor:
        device = t.device
        half_dim = self.dim // 2
        embeddings = math.log(10000) / (half_dim - 1)
        embeddings = torch.exp(torch.arange(half_dim, device=device) * -embeddings)
        embeddings = t[:, None] * embeddings[None, :]
        embeddings = torch.cat([torch.sin(embeddings), torch.cos(embeddings)], dim=-1)
        return embeddings


class ResidualBlock(nn.Module):
    """Residual block with time embedding."""
    
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        time_emb_dim: int,
        dropout: float = 0.0,
    ):
        super().__init__()
        
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1)
        
        self.norm1 = nn.GroupNorm(8, in_channels)
        self.norm2 = nn.GroupNorm(8, out_channels)
        
        self.time_mlp = nn.Sequential(
            nn.SiLU(),
            nn.Linear(time_emb_dim, out_channels),
        )
        
        self.dropout = nn.Dropout(dropout) if dropout > 0 else nn.Identity()
        
        if in_channels != out_channels:
            self.shortcut = nn.Conv2d(in_channels, out_channels, 1)
        else:
            self.shortcut = nn.Identity()
    
    def forward(self, x: torch.Tensor, t_emb: torch.Tensor) -> torch.Tensor:
        h = self.norm1(x)
        h = F.silu(h)
        h = self.conv1(h)
        
        # Add time embedding
        t = self.time_mlp(t_emb)
        h = h + t[:, :, None, None]
        
        h = self.norm2(h)
        h = F.silu(h)
        h = self.dropout(h)
        h = self.conv2(h)
        
        return h + self.shortcut(x)


class SelfAttention(nn.Module):
    """Self-attention block."""
    
    def __init__(self, channels: int, num_heads: int = 4):
        super().__init__()
        self.num_heads = num_heads
        self.norm = nn.GroupNorm(8, channels)
        self.qkv = nn.Conv2d(channels, channels * 3, 1)
        self.proj = nn.Conv2d(channels, channels, 1)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, C, H, W = x.shape
        
        h = self.norm(x)
        qkv = self.qkv(h)
        q, k, v = qkv.chunk(3, dim=1)
        
        # Reshape for attention
        q = q.view(B, self.num_heads, C // self.num_heads, H * W)
        k = k.view(B, self.num_heads, C // self.num_heads, H * W)
        v = v.view(B, self.num_heads, C // self.num_heads, H * W)
        
        # Attention
        scale = (C // self.num_heads) ** -0.5
        attn = torch.softmax(q.transpose(-1, -2) @ k * scale, dim=-1)
        out = (v @ attn.transpose(-1, -2)).view(B, C, H, W)
        
        return x + self.proj(out)


class UNet(nn.Module):
    """U-Net architecture for diffusion model."""
    
    def __init__(self, config: DiffusionConfig):
        super().__init__()
        self.config = config
        
        time_emb_dim = config.model_channels * 4
        
        # Time embedding
        self.time_emb = nn.Sequential(
            SinusoidalPositionEmbedding(config.model_channels),
            nn.Linear(config.model_channels, time_emb_dim),
            nn.SiLU(),
            nn.Linear(time_emb_dim, time_emb_dim),
        )
        
        # Input: image + mask for inpainting
        in_ch = config.img_channels * 2  # Noisy image + mask
        
        # Encoder
        self.conv_in = nn.Conv2d(in_ch, config.model_channels, 3, padding=1)
        
        ch = config.model_channels
        self.down_blocks = nn.ModuleList([
            self._make_down_block(ch, ch, time_emb_dim),
            self._make_down_block(ch, ch * 2, time_emb_dim),
            self._make_down_block(ch * 2, ch * 4, time_emb_dim),
            self._make_down_block(ch * 4, ch * 8, time_emb_dim),
        ])
        
        # Middle
        self.mid_block1 = ResidualBlock(ch * 8, ch * 8, time_emb_dim)
        self.mid_attn = SelfAttention(ch * 8)
        self.mid_block2 = ResidualBlock(ch * 8, ch * 8, time_emb_dim)
        
        # Decoder
        self.up_blocks = nn.ModuleList([
            self._make_up_block(ch * 16, ch * 4, time_emb_dim),
            self._make_up_block(ch * 8, ch * 2, time_emb_dim),
            self._make_up_block(ch * 4, ch, time_emb_dim),
            self._make_up_block(ch * 2, ch, time_emb_dim),
        ])
        
        # Output
        self.conv_out = nn.Sequential(
            nn.GroupNorm(8, ch),
            nn.SiLU(),
            nn.Conv2d(ch, config.img_channels, 3, padding=1),
        )
    
    def _make_down_block(
        self,
        in_ch: int,
        out_ch: int,
        time_emb_dim: int,
    ) -> nn.Module:
        return nn.ModuleList([
            ResidualBlock(in_ch, out_ch, time_emb_dim),
            ResidualBlock(out_ch, out_ch, time_emb_dim),
            nn.Conv2d(out_ch, out_ch, 3, stride=2, padding=1),
        ])
    
    def _make_up_block(
        self,
        in_ch: int,
        out_ch: int,
        time_emb_dim: int,
    ) -> nn.Module:
        return nn.ModuleList([
            ResidualBlock(in_ch, out_ch, time_emb_dim),
            ResidualBlock(out_ch, out_ch, time_emb_dim),
            nn.ConvTranspose2d(out_ch, out_ch, 4, stride=2, padding=1),
        ])
    
    def forward(
        self,
        x: torch.Tensor,
        t: torch.Tensor,
        mask: torch.Tensor,
    ) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            x: Noisy image [B, C, H, W]
            t: Timestep [B]
            mask: Inpainting mask [B, 1, H, W]
            
        Returns:
            Predicted noise
        """
        # Time embedding
        t_emb = self.time_emb(t)
        
        # Concatenate image and mask
        h = torch.cat([x, mask.expand_as(x)], dim=1)
        h = self.conv_in(h)
        
        # Encoder
        skip_connections = []
        for down_block in self.down_blocks:
            h = down_block[0](h, t_emb)
            h = down_block[1](h, t_emb)
            skip_connections.append(h)
            h = down_block[2](h)
        
        # Middle
        h = self.mid_block1(h, t_emb)
        h = self.mid_attn(h)
        h = self.mid_block2(h, t_emb)
        
        # Decoder
        for i, up_block in enumerate(self.up_blocks):
            h = up_block[2](h)  # Upsample first
            skip = skip_connections[-(i + 1)]
            h = torch.cat([h, skip], dim=1)
            h = up_block[0](h, t_emb)
            h = up_block[1](h, t_emb)
        
        return self.conv_out(h)


class CounterfactualInpainter(nn.Module):
    """
    Diffusion-based inpainting for counterfactual explanations.
    
    Creates "what if" scenarios by inpainting suspected lesion 
    regions with healthy tissue, enabling sensitivity analysis.
    """
    
    def __init__(self, config: Optional[DiffusionConfig] = None):
        super().__init__()
        self.config = config or DiffusionConfig()
        
        # Build noise schedule
        betas = get_beta_schedule(
            self.config.beta_schedule,
            self.config.timesteps,
            self.config.beta_start,
            self.config.beta_end,
        )
        
        alphas = 1.0 - betas
        alphas_cumprod = torch.cumprod(alphas, dim=0)
        alphas_cumprod_prev = F.pad(alphas_cumprod[:-1], (1, 0), value=1.0)
        
        # Register buffers
        self.register_buffer("betas", betas)
        self.register_buffer("alphas_cumprod", alphas_cumprod)
        self.register_buffer("alphas_cumprod_prev", alphas_cumprod_prev)
        self.register_buffer("sqrt_alphas_cumprod", torch.sqrt(alphas_cumprod))
        self.register_buffer("sqrt_one_minus_alphas_cumprod", torch.sqrt(1 - alphas_cumprod))
        
        # Posterior variance
        posterior_variance = betas * (1.0 - alphas_cumprod_prev) / (1.0 - alphas_cumprod)
        self.register_buffer("posterior_variance", posterior_variance)
        self.register_buffer("posterior_log_variance", torch.log(torch.clamp(posterior_variance, min=1e-20)))
        
        # Denoising model
        self.model = UNet(self.config)
    
    def q_sample(
        self,
        x_start: torch.Tensor,
        t: torch.Tensor,
        noise: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """Add noise to image (forward diffusion)."""
        if noise is None:
            noise = torch.randn_like(x_start)
        
        sqrt_alpha = self.sqrt_alphas_cumprod[t][:, None, None, None]
        sqrt_one_minus_alpha = self.sqrt_one_minus_alphas_cumprod[t][:, None, None, None]
        
        return sqrt_alpha * x_start + sqrt_one_minus_alpha * noise
    
    def p_sample(
        self,
        x: torch.Tensor,
        t: torch.Tensor,
        mask: torch.Tensor,
        original: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """Single denoising step."""
        # Predict noise
        noise_pred = self.model(x, t, mask)
        
        # Get schedule values
        beta = self.betas[t][:, None, None, None]
        alpha = 1 - beta
        alpha_bar = self.alphas_cumprod[t][:, None, None, None]
        alpha_bar_prev = self.alphas_cumprod_prev[t][:, None, None, None]
        
        # Compute mean
        x0_pred = (x - torch.sqrt(1 - alpha_bar) * noise_pred) / torch.sqrt(alpha_bar)
        x0_pred = torch.clamp(x0_pred, -1, 1)
        
        mean = (torch.sqrt(alpha_bar_prev) * beta / (1 - alpha_bar)) * x0_pred + \
               (torch.sqrt(alpha) * (1 - alpha_bar_prev) / (1 - alpha_bar)) * x
        
        # Sample
        if t[0] > 0:
            noise = torch.randn_like(x)
            variance = self.posterior_variance[t][:, None, None, None]
            x = mean + torch.sqrt(variance) * noise
        else:
            x = mean
        
        # Apply mask constraint - keep original content outside mask
        if original is not None:
            x = x * mask + original * (1 - mask)
        
        return x
    
    @torch.no_grad()
    def inpaint(
        self,
        image: torch.Tensor,
        mask: torch.Tensor,
        num_steps: Optional[int] = None,
        guidance_scale: float = 1.0,
    ) -> Dict[str, torch.Tensor]:
        """
        Inpaint masked region with healthy tissue.
        
        Args:
            image: Original image [B, C, H, W] in range [-1, 1]
            mask: Binary mask [B, 1, H, W] where 1 = region to inpaint
            num_steps: Number of denoising steps (default: all timesteps)
            guidance_scale: Classifier-free guidance scale
            
        Returns:
            Dictionary with inpainted image and intermediates
        """
        device = image.device
        B = image.shape[0]
        num_steps = num_steps or self.config.timesteps
        
        # Start from noise in masked region, original elsewhere
        x = torch.randn_like(image)
        x = x * mask + image * (1 - mask)
        
        # Denoise
        intermediates = []
        for i in reversed(range(num_steps)):
            t = torch.full((B,), i, device=device, dtype=torch.long)
            x = self.p_sample(x, t, mask, image)
            
            if i % (num_steps // 10) == 0:
                intermediates.append(x.clone())
        
        return {
            "inpainted": x,
            "original": image,
            "mask": mask,
            "intermediates": intermediates,
        }
    
    def sensitivity_analysis(
        self,
        image: torch.Tensor,
        mask: torch.Tensor,
        prediction_fn: Callable[[torch.Tensor], torch.Tensor],
        num_samples: int = 5,
    ) -> Dict[str, torch.Tensor]:
        """
        Analyze model sensitivity to inpainted region.
        
        Args:
            image: Original image
            mask: Lesion mask to inpaint
            prediction_fn: Function that returns model predictions
            num_samples: Number of inpainting samples
            
        Returns:
            Sensitivity analysis results
        """
        device = image.device
        
        # Original prediction
        with torch.no_grad():
            original_pred = prediction_fn(image)
        
        # Multiple inpainting samples for uncertainty
        counterfactual_preds = []
        inpainted_images = []
        
        for _ in range(num_samples):
            result = self.inpaint(image, mask)
            inpainted = result["inpainted"]
            inpainted_images.append(inpainted)
            
            with torch.no_grad():
                pred = prediction_fn(inpainted)
                counterfactual_preds.append(pred)
        
        counterfactual_preds = torch.stack(counterfactual_preds)
        inpainted_images = torch.stack(inpainted_images)
        
        # Compute statistics
        mean_cf_pred = counterfactual_preds.mean(dim=0)
        std_cf_pred = counterfactual_preds.std(dim=0)
        
        # Sensitivity = drop in confidence when lesion is removed
        sensitivity = original_pred - mean_cf_pred
        
        return {
            "original_prediction": original_pred,
            "counterfactual_mean": mean_cf_pred,
            "counterfactual_std": std_cf_pred,
            "sensitivity": sensitivity,
            "sensitivity_confidence": 1.0 / (1.0 + std_cf_pred),
            "inpainted_samples": inpainted_images,
        }
    
    def compute_loss(
        self,
        x_start: torch.Tensor,
        mask: torch.Tensor,
    ) -> torch.Tensor:
        """Compute training loss."""
        B = x_start.shape[0]
        device = x_start.device
        
        # Random timesteps
        t = torch.randint(0, self.config.timesteps, (B,), device=device)
        
        # Add noise
        noise = torch.randn_like(x_start)
        x_noisy = self.q_sample(x_start, t, noise)
        
        # Predict noise
        noise_pred = self.model(x_noisy, t, mask)
        
        # MSE loss
        loss = F.mse_loss(noise_pred, noise)
        
        return loss


class DiffusionTrainer:
    """Trainer for diffusion inpainting model."""
    
    def __init__(
        self,
        model: CounterfactualInpainter,
        device: torch.device,
        learning_rate: float = 1e-4,
    ):
        self.model = model.to(device)
        self.device = device
        
        self.optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=learning_rate,
        )
        
        self.scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer,
            T_max=100,
        )
    
    def train_step(
        self,
        images: torch.Tensor,
        masks: torch.Tensor,
    ) -> float:
        """Single training step."""
        images = images.to(self.device)
        masks = masks.to(self.device)
        
        self.optimizer.zero_grad()
        loss = self.model.compute_loss(images, masks)
        loss.backward()
        self.optimizer.step()
        
        return loss.item()


def create_inpainter(
    img_size: int = 256,
    timesteps: int = 1000,
    device: str = "cuda",
) -> CounterfactualInpainter:
    """
    Factory function to create inpainter.
    
    Args:
        img_size: Target image size
        timesteps: Number of diffusion steps
        device: Target device
        
    Returns:
        Initialized CounterfactualInpainter
    """
    config = DiffusionConfig(
        img_size=img_size,
        timesteps=timesteps,
    )
    model = CounterfactualInpainter(config)
    return model.to(device)
