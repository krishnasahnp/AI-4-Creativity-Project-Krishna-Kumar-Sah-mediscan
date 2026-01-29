"""
MediVision AI - Speckle Style GAN

GAN-based augmentation for ultrasound images to generate
realistic speckle variations for robust model training.

Based on DCGAN architecture with ultrasound-specific modifications.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from typing import Dict, List, Optional, Tuple
import numpy as np
from dataclasses import dataclass


@dataclass
class GANConfig:
    """Configuration for SpeckleStyleGAN."""
    latent_dim: int = 100
    img_size: int = 256
    img_channels: int = 1
    feature_maps_g: int = 64
    feature_maps_d: int = 64
    learning_rate_g: float = 0.0002
    learning_rate_d: float = 0.0002
    beta1: float = 0.5
    beta2: float = 0.999
    noise_level: float = 0.1


class GeneratorBlock(nn.Module):
    """Transposed convolution block for generator."""
    
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int = 4,
        stride: int = 2,
        padding: int = 1,
        use_bn: bool = True,
    ):
        super().__init__()
        layers = [
            nn.ConvTranspose2d(
                in_channels, out_channels,
                kernel_size, stride, padding, bias=False
            )
        ]
        if use_bn:
            layers.append(nn.BatchNorm2d(out_channels))
        layers.append(nn.ReLU(inplace=True))
        
        self.block = nn.Sequential(*layers)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class DiscriminatorBlock(nn.Module):
    """Convolution block for discriminator."""
    
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int = 4,
        stride: int = 2,
        padding: int = 1,
        use_bn: bool = True,
    ):
        super().__init__()
        layers = [
            nn.Conv2d(
                in_channels, out_channels,
                kernel_size, stride, padding, bias=False
            )
        ]
        if use_bn:
            layers.append(nn.BatchNorm2d(out_channels))
        layers.append(nn.LeakyReLU(0.2, inplace=True))
        
        self.block = nn.Sequential(*layers)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class SpeckleGenerator(nn.Module):
    """
    Generator network for ultrasound speckle patterns.
    
    Takes a latent vector and optional conditioning image to generate
    realistic speckle noise patterns that can be added to clean images.
    """
    
    def __init__(self, config: GANConfig):
        super().__init__()
        self.config = config
        nf = config.feature_maps_g
        
        # Project latent vector to feature maps
        self.project = nn.Sequential(
            nn.Linear(config.latent_dim, nf * 16 * 4 * 4),
            nn.BatchNorm1d(nf * 16 * 4 * 4),
            nn.ReLU(inplace=True),
        )
        
        # Upsampling layers: 4x4 -> 8x8 -> 16x16 -> 32x32 -> 64x64 -> 128x128 -> 256x256
        self.decoder = nn.Sequential(
            GeneratorBlock(nf * 16, nf * 8),   # 4 -> 8
            GeneratorBlock(nf * 8, nf * 4),    # 8 -> 16
            GeneratorBlock(nf * 4, nf * 2),    # 16 -> 32
            GeneratorBlock(nf * 2, nf),        # 32 -> 64
            GeneratorBlock(nf, nf // 2),       # 64 -> 128
            nn.ConvTranspose2d(nf // 2, config.img_channels, 4, 2, 1, bias=False),
            nn.Tanh(),
        )
        
        # Speckle-specific layers - generates texture patterns
        self.speckle_modulation = nn.Sequential(
            nn.Conv2d(config.img_channels, nf // 2, 3, 1, 1),
            nn.BatchNorm2d(nf // 2),
            nn.LeakyReLU(0.2),
            nn.Conv2d(nf // 2, config.img_channels, 3, 1, 1),
            nn.Sigmoid(),
        )
        
        self._init_weights()
    
    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, (nn.Conv2d, nn.ConvTranspose2d)):
                nn.init.normal_(m.weight, 0.0, 0.02)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.normal_(m.weight, 1.0, 0.02)
                nn.init.zeros_(m.bias)
    
    def forward(
        self,
        z: torch.Tensor,
        condition: Optional[torch.Tensor] = None,
    ) -> Dict[str, torch.Tensor]:
        """
        Generate speckle pattern.
        
        Args:
            z: Latent vector [B, latent_dim]
            condition: Optional conditioning image [B, C, H, W]
            
        Returns:
            Dictionary with generated speckle and modulation mask
        """
        B = z.shape[0]
        
        # Project and reshape
        h = self.project(z)
        h = h.view(B, -1, 4, 4)
        
        # Generate base pattern
        base_pattern = self.decoder(h)
        
        # Generate modulation mask for more realistic speckle
        speckle_mask = self.speckle_modulation(base_pattern)
        
        # Final speckle pattern
        speckle = base_pattern * speckle_mask
        
        return {
            "speckle": speckle,
            "base_pattern": base_pattern,
            "modulation_mask": speckle_mask,
        }


class SpeckleDiscriminator(nn.Module):
    """
    Discriminator network to distinguish real vs. synthetic speckle.
    
    Uses PatchGAN-style architecture for local realism assessment.
    """
    
    def __init__(self, config: GANConfig):
        super().__init__()
        self.config = config
        nf = config.feature_maps_d
        
        # Encoder: 256 -> 128 -> 64 -> 32 -> 16 -> 8 -> 4
        self.encoder = nn.Sequential(
            DiscriminatorBlock(config.img_channels, nf, use_bn=False),  # 256 -> 128
            DiscriminatorBlock(nf, nf * 2),        # 128 -> 64
            DiscriminatorBlock(nf * 2, nf * 4),    # 64 -> 32
            DiscriminatorBlock(nf * 4, nf * 8),    # 32 -> 16
            DiscriminatorBlock(nf * 8, nf * 16),   # 16 -> 8
            nn.Conv2d(nf * 16, 1, 4, 1, 0),        # 8 -> 4 (patch scores)
        )
        
        self._init_weights()
    
    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.normal_(m.weight, 0.0, 0.02)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.normal_(m.weight, 1.0, 0.02)
                nn.init.zeros_(m.bias)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Compute realness score.
        
        Args:
            x: Input image [B, C, H, W]
            
        Returns:
            Patch-wise realness scores
        """
        return self.encoder(x)


class SpeckleStyleGAN(nn.Module):
    """
    Complete GAN system for ultrasound speckle augmentation.
    
    Generates realistic speckle variations that can be used to
    augment training data for more robust ultrasound models.
    
    Features:
    - DCGAN-style architecture optimized for speckle patterns
    - Conditional generation based on input image
    - Multiple augmentation modes (additive, multiplicative, mixed)
    """
    
    def __init__(self, config: Optional[GANConfig] = None):
        super().__init__()
        self.config = config or GANConfig()
        
        self.generator = SpeckleGenerator(self.config)
        self.discriminator = SpeckleDiscriminator(self.config)
        
        # Tag for synthetic data tracking
        self.synthetic_tag = "GAN_GENERATED"
    
    def generate_speckle(
        self,
        batch_size: int,
        device: torch.device,
    ) -> torch.Tensor:
        """Generate random speckle patterns."""
        z = torch.randn(batch_size, self.config.latent_dim, device=device)
        with torch.no_grad():
            output = self.generator(z)
        return output["speckle"]
    
    def augment(
        self,
        image: torch.Tensor,
        strength: float = 0.3,
        mode: str = "mixed",
    ) -> Dict[str, torch.Tensor]:
        """
        Augment an ultrasound image with synthetic speckle.
        
        Args:
            image: Input image [B, C, H, W] in range [0, 1]
            strength: Augmentation strength (0 to 1)
            mode: 'additive', 'multiplicative', or 'mixed'
            
        Returns:
            Dictionary with augmented image and metadata
        """
        B, C, H, W = image.shape
        device = image.device
        
        # Generate speckle
        z = torch.randn(B, self.config.latent_dim, device=device)
        speckle_output = self.generator(z)
        speckle = speckle_output["speckle"]
        
        # Resize if needed
        if speckle.shape[-2:] != (H, W):
            speckle = F.interpolate(speckle, size=(H, W), mode='bilinear')
        
        # Apply augmentation based on mode
        if mode == "additive":
            augmented = image + strength * speckle
        elif mode == "multiplicative":
            # Multiplicative noise (more realistic for speckle)
            augmented = image * (1 + strength * speckle)
        else:  # mixed
            # Combination of both
            augmented = image * (1 + 0.5 * strength * speckle) + 0.5 * strength * speckle
        
        # Clamp to valid range
        augmented = torch.clamp(augmented, 0, 1)
        
        return {
            "augmented": augmented,
            "original": image,
            "speckle": speckle,
            "strength": strength,
            "mode": mode,
            "synthetic_tag": self.synthetic_tag,
        }
    
    def compute_losses(
        self,
        real_images: torch.Tensor,
        fake_images: torch.Tensor,
    ) -> Dict[str, torch.Tensor]:
        """
        Compute GAN losses.
        
        Args:
            real_images: Real ultrasound speckle patterns
            fake_images: Generated speckle patterns
            
        Returns:
            Dictionary with generator and discriminator losses
        """
        # Labels
        real_label = 1.0
        fake_label = 0.0
        
        # Discriminator loss
        real_pred = self.discriminator(real_images)
        fake_pred = self.discriminator(fake_images.detach())
        
        d_loss_real = F.binary_cross_entropy_with_logits(
            real_pred, torch.full_like(real_pred, real_label)
        )
        d_loss_fake = F.binary_cross_entropy_with_logits(
            fake_pred, torch.full_like(fake_pred, fake_label)
        )
        d_loss = (d_loss_real + d_loss_fake) / 2
        
        # Generator loss
        fake_pred_g = self.discriminator(fake_images)
        g_loss = F.binary_cross_entropy_with_logits(
            fake_pred_g, torch.full_like(fake_pred_g, real_label)
        )
        
        return {
            "d_loss": d_loss,
            "d_loss_real": d_loss_real,
            "d_loss_fake": d_loss_fake,
            "g_loss": g_loss,
        }


class GANTrainer:
    """Trainer for SpeckleStyleGAN."""
    
    def __init__(
        self,
        model: SpeckleStyleGAN,
        device: torch.device,
        config: Optional[GANConfig] = None,
    ):
        self.model = model.to(device)
        self.device = device
        self.config = config or model.config
        
        # Optimizers
        self.optimizer_g = torch.optim.Adam(
            model.generator.parameters(),
            lr=self.config.learning_rate_g,
            betas=(self.config.beta1, self.config.beta2),
        )
        self.optimizer_d = torch.optim.Adam(
            model.discriminator.parameters(),
            lr=self.config.learning_rate_d,
            betas=(self.config.beta1, self.config.beta2),
        )
    
    def train_step(
        self,
        real_images: torch.Tensor,
    ) -> Dict[str, float]:
        """
        Single training step.
        
        Args:
            real_images: Batch of real ultrasound images
            
        Returns:
            Dictionary with loss values
        """
        real_images = real_images.to(self.device)
        B = real_images.shape[0]
        
        # Generate fake images
        z = torch.randn(B, self.config.latent_dim, device=self.device)
        fake_output = self.model.generator(z)
        fake_images = fake_output["speckle"]
        
        # ----- Train Discriminator -----
        self.optimizer_d.zero_grad()
        losses = self.model.compute_losses(real_images, fake_images)
        losses["d_loss"].backward()
        self.optimizer_d.step()
        
        # ----- Train Generator -----
        self.optimizer_g.zero_grad()
        
        # Generate new fake images
        z = torch.randn(B, self.config.latent_dim, device=self.device)
        fake_output = self.model.generator(z)
        fake_images = fake_output["speckle"]
        
        # Recompute generator loss
        fake_pred = self.model.discriminator(fake_images)
        g_loss = F.binary_cross_entropy_with_logits(
            fake_pred, torch.ones_like(fake_pred)
        )
        g_loss.backward()
        self.optimizer_g.step()
        
        return {
            "d_loss": losses["d_loss"].item(),
            "g_loss": g_loss.item(),
        }
    
    def train_epoch(
        self,
        dataloader: DataLoader,
    ) -> Dict[str, float]:
        """Train for one epoch."""
        self.model.train()
        
        total_d_loss = 0.0
        total_g_loss = 0.0
        num_batches = 0
        
        for batch in dataloader:
            if isinstance(batch, (list, tuple)):
                images = batch[0]
            else:
                images = batch
            
            losses = self.train_step(images)
            total_d_loss += losses["d_loss"]
            total_g_loss += losses["g_loss"]
            num_batches += 1
        
        return {
            "d_loss": total_d_loss / num_batches,
            "g_loss": total_g_loss / num_batches,
        }


def create_speckle_gan(
    img_size: int = 256,
    latent_dim: int = 100,
    device: str = "cuda",
) -> SpeckleStyleGAN:
    """
    Factory function to create SpeckleStyleGAN.
    
    Args:
        img_size: Target image size
        latent_dim: Dimension of latent vector
        device: Target device
        
    Returns:
        Initialized SpeckleStyleGAN model
    """
    config = GANConfig(
        img_size=img_size,
        latent_dim=latent_dim,
    )
    model = SpeckleStyleGAN(config)
    return model.to(device)


def compute_fid_score(
    real_features: np.ndarray,
    fake_features: np.ndarray,
) -> float:
    """
    Compute Fréchet Inception Distance for quality assessment.
    
    Args:
        real_features: Features from real images
        fake_features: Features from generated images
        
    Returns:
        FID score (lower is better)
    """
    # Compute mean and covariance
    mu_real = np.mean(real_features, axis=0)
    mu_fake = np.mean(fake_features, axis=0)
    
    sigma_real = np.cov(real_features, rowvar=False)
    sigma_fake = np.cov(fake_features, rowvar=False)
    
    # Compute FID
    diff = mu_real - mu_fake
    
    # Product of covariances
    covmean = np.sqrt(sigma_real @ sigma_fake)
    
    # Handle numerical issues
    if np.iscomplexobj(covmean):
        covmean = covmean.real
    
    fid = diff @ diff + np.trace(sigma_real + sigma_fake - 2 * covmean)
    
    return float(fid)
