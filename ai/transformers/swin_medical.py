"""
MediVision AI - Vision Transformer for Medical Imaging

Swin Transformer-based model for CT/Ultrasound classification and segmentation.

Author: MediVision AI Team
"""

import math
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F


class PatchEmbed(nn.Module):
    """Image to Patch Embedding."""
    
    def __init__(
        self,
        img_size: int = 224,
        patch_size: int = 4,
        in_chans: int = 1,
        embed_dim: int = 96
    ):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.patches_resolution = img_size // patch_size
        self.num_patches = self.patches_resolution ** 2
        
        self.proj = nn.Conv2d(
            in_chans, embed_dim,
            kernel_size=patch_size, stride=patch_size
        )
        self.norm = nn.LayerNorm(embed_dim)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.proj(x)  # (B, C, H, W)
        x = x.flatten(2).transpose(1, 2)  # (B, N, C)
        x = self.norm(x)
        return x


class WindowAttention(nn.Module):
    """Window-based Multi-head Self-Attention."""
    
    def __init__(
        self,
        dim: int,
        window_size: int,
        num_heads: int,
        qkv_bias: bool = True,
        attn_drop: float = 0.0,
        proj_drop: float = 0.0
    ):
        super().__init__()
        self.dim = dim
        self.window_size = window_size
        self.num_heads = num_heads
        self.head_dim = dim // num_heads
        self.scale = self.head_dim ** -0.5
        
        self.qkv = nn.Linear(dim, dim * 3, bias=qkv_bias)
        self.attn_drop = nn.Dropout(attn_drop)
        self.proj = nn.Linear(dim, dim)
        self.proj_drop = nn.Dropout(proj_drop)
        
        # Relative position bias
        self.relative_position_bias_table = nn.Parameter(
            torch.zeros((2 * window_size - 1) ** 2, num_heads)
        )
        nn.init.trunc_normal_(self.relative_position_bias_table, std=0.02)
        
        coords = torch.stack(torch.meshgrid([
            torch.arange(window_size),
            torch.arange(window_size)
        ], indexing='ij'))
        coords_flatten = coords.flatten(1)
        relative_coords = coords_flatten[:, :, None] - coords_flatten[:, None, :]
        relative_coords = relative_coords.permute(1, 2, 0).contiguous()
        relative_coords[:, :, 0] += window_size - 1
        relative_coords[:, :, 1] += window_size - 1
        relative_coords[:, :, 0] *= 2 * window_size - 1
        relative_position_index = relative_coords.sum(-1)
        self.register_buffer("relative_position_index", relative_position_index)
    
    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        B_, N, C = x.shape
        
        qkv = self.qkv(x).reshape(B_, N, 3, self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]
        
        q = q * self.scale
        attn = q @ k.transpose(-2, -1)
        
        relative_position_bias = self.relative_position_bias_table[
            self.relative_position_index.view(-1)
        ].view(self.window_size ** 2, self.window_size ** 2, -1)
        relative_position_bias = relative_position_bias.permute(2, 0, 1).contiguous()
        attn = attn + relative_position_bias.unsqueeze(0)
        
        if mask is not None:
            nW = mask.shape[0]
            attn = attn.view(B_ // nW, nW, self.num_heads, N, N)
            attn = attn + mask.unsqueeze(1).unsqueeze(0)
            attn = attn.view(-1, self.num_heads, N, N)
        
        attn = F.softmax(attn, dim=-1)
        attn_weights = attn.clone()
        attn = self.attn_drop(attn)
        
        x = (attn @ v).transpose(1, 2).reshape(B_, N, C)
        x = self.proj(x)
        x = self.proj_drop(x)
        
        return x, attn_weights


class SwinTransformerBlock(nn.Module):
    """Swin Transformer Block."""
    
    def __init__(
        self,
        dim: int,
        num_heads: int,
        window_size: int = 7,
        shift_size: int = 0,
        mlp_ratio: float = 4.0,
        qkv_bias: bool = True,
        drop: float = 0.0,
        attn_drop: float = 0.0,
        drop_path: float = 0.0
    ):
        super().__init__()
        self.dim = dim
        self.num_heads = num_heads
        self.window_size = window_size
        self.shift_size = shift_size
        self.mlp_ratio = mlp_ratio
        
        self.norm1 = nn.LayerNorm(dim)
        self.attn = WindowAttention(
            dim, window_size, num_heads, qkv_bias, attn_drop, drop
        )
        self.drop_path = nn.Dropout(drop_path) if drop_path > 0. else nn.Identity()
        self.norm2 = nn.LayerNorm(dim)
        
        mlp_hidden = int(dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(dim, mlp_hidden),
            nn.GELU(),
            nn.Dropout(drop),
            nn.Linear(mlp_hidden, dim),
            nn.Dropout(drop)
        )
    
    def forward(self, x: torch.Tensor, H: int, W: int) -> Tuple[torch.Tensor, torch.Tensor]:
        B, L, C = x.shape
        
        shortcut = x
        x = self.norm1(x)
        x = x.view(B, H, W, C)
        
        # Pad for window partition
        pad_r = (self.window_size - W % self.window_size) % self.window_size
        pad_b = (self.window_size - H % self.window_size) % self.window_size
        x = F.pad(x, (0, 0, 0, pad_r, 0, pad_b))
        Hp, Wp = x.shape[1], x.shape[2]
        
        # Cyclic shift
        if self.shift_size > 0:
            x = torch.roll(x, shifts=(-self.shift_size, -self.shift_size), dims=(1, 2))
        
        # Window partition
        x_windows = window_partition(x, self.window_size)
        x_windows = x_windows.view(-1, self.window_size ** 2, C)
        
        # Attention
        attn_windows, attn_weights = self.attn(x_windows)
        
        # Merge windows
        attn_windows = attn_windows.view(-1, self.window_size, self.window_size, C)
        x = window_reverse(attn_windows, self.window_size, Hp, Wp)
        
        # Reverse cyclic shift
        if self.shift_size > 0:
            x = torch.roll(x, shifts=(self.shift_size, self.shift_size), dims=(1, 2))
        
        # Remove padding
        x = x[:, :H, :W, :].contiguous().view(B, L, C)
        
        # FFN
        x = shortcut + self.drop_path(x)
        x = x + self.drop_path(self.mlp(self.norm2(x)))
        
        return x, attn_weights


def window_partition(x: torch.Tensor, window_size: int) -> torch.Tensor:
    """Partition into windows."""
    B, H, W, C = x.shape
    x = x.view(B, H // window_size, window_size, W // window_size, window_size, C)
    windows = x.permute(0, 1, 3, 2, 4, 5).contiguous()
    windows = windows.view(-1, window_size, window_size, C)
    return windows


def window_reverse(windows: torch.Tensor, window_size: int, H: int, W: int) -> torch.Tensor:
    """Reverse window partition."""
    B = int(windows.shape[0] / (H * W / window_size / window_size))
    x = windows.view(B, H // window_size, W // window_size, window_size, window_size, -1)
    x = x.permute(0, 1, 3, 2, 4, 5).contiguous().view(B, H, W, -1)
    return x


class MediVisionSwin(nn.Module):
    """
    Swin Transformer for Medical Image Analysis.
    
    Supports both classification and segmentation tasks.
    """
    
    def __init__(
        self,
        img_size: int = 224,
        patch_size: int = 4,
        in_chans: int = 1,
        num_classes: int = 2,
        embed_dim: int = 96,
        depths: List[int] = [2, 2, 6, 2],
        num_heads: List[int] = [3, 6, 12, 24],
        window_size: int = 7,
        mlp_ratio: float = 4.0,
        drop_rate: float = 0.0,
        attn_drop_rate: float = 0.0,
        drop_path_rate: float = 0.1,
        segmentation: bool = False
    ):
        super().__init__()
        self.num_classes = num_classes
        self.num_layers = len(depths)
        self.embed_dim = embed_dim
        self.segmentation = segmentation
        
        # Patch embedding
        self.patch_embed = PatchEmbed(img_size, patch_size, in_chans, embed_dim)
        self.patches_resolution = img_size // patch_size
        
        # Stochastic depth
        dpr = [x.item() for x in torch.linspace(0, drop_path_rate, sum(depths))]
        
        # Build layers
        self.layers = nn.ModuleList()
        for i_layer in range(self.num_layers):
            layer = nn.ModuleList([
                SwinTransformerBlock(
                    dim=int(embed_dim * 2 ** i_layer),
                    num_heads=num_heads[i_layer],
                    window_size=window_size,
                    shift_size=0 if (j % 2 == 0) else window_size // 2,
                    mlp_ratio=mlp_ratio,
                    drop=drop_rate,
                    attn_drop=attn_drop_rate,
                    drop_path=dpr[sum(depths[:i_layer]) + j]
                )
                for j in range(depths[i_layer])
            ])
            self.layers.append(layer)
        
        # Final norm
        self.norm = nn.LayerNorm(int(embed_dim * 2 ** (self.num_layers - 1)))
        
        # Classification head
        self.head = nn.Linear(
            int(embed_dim * 2 ** (self.num_layers - 1)),
            num_classes
        )
        
        # Segmentation decoder (if needed)
        if segmentation:
            self.seg_head = self._build_seg_decoder(embed_dim, num_classes)
        
        self._init_weights()
    
    def _build_seg_decoder(self, embed_dim: int, num_classes: int) -> nn.Module:
        """Build UPerNet-style segmentation decoder."""
        return nn.Sequential(
            nn.Conv2d(embed_dim * 8, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=4, mode='bilinear', align_corners=False),
            nn.Conv2d(256, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=4, mode='bilinear', align_corners=False),
            nn.Conv2d(128, num_classes, 1)
        )
    
    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.trunc_normal_(m.weight, std=0.02)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
            elif isinstance(m, nn.LayerNorm):
                nn.init.ones_(m.weight)
                nn.init.zeros_(m.bias)
    
    def forward_features(self, x: torch.Tensor) -> Tuple[torch.Tensor, List[torch.Tensor]]:
        """Extract features with attention maps."""
        x = self.patch_embed(x)
        H = W = self.patches_resolution
        
        attention_maps = []
        
        for layer in self.layers:
            for blk in layer:
                x, attn = blk(x, H, W)
                attention_maps.append(attn)
            # Downsample (simplified)
            if layer != self.layers[-1]:
                H, W = H // 2, W // 2
        
        x = self.norm(x)
        return x, attention_maps
    
    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Forward pass.
        
        Returns:
            Dict with 'logits', 'attention', and optionally 'segmentation'
        """
        features, attention_maps = self.forward_features(x)
        
        # Global average pooling for classification
        cls_features = features.mean(dim=1)
        logits = self.head(cls_features)
        
        output = {
            'logits': logits,
            'attention': attention_maps[-1],
            'features': cls_features
        }
        
        if self.segmentation:
            # Reshape for decoder
            B, L, C = features.shape
            H = W = int(math.sqrt(L))
            seg_features = features.transpose(1, 2).view(B, C, H, W)
            seg_out = self.seg_head(seg_features)
            output['segmentation'] = seg_out
        
        return output
    
    def get_attention_map(self, x: torch.Tensor) -> torch.Tensor:
        """Get attention visualization for explainability."""
        with torch.no_grad():
            _, attention_maps = self.forward_features(x)
            # Average over heads and return last layer attention
            attn = attention_maps[-1].mean(dim=1)
            return attn


def create_medivision_swin(
    num_classes: int = 2,
    img_size: int = 224,
    in_chans: int = 1,
    segmentation: bool = False,
    pretrained: bool = False
) -> MediVisionSwin:
    """
    Factory function to create MediVision Swin model.
    
    Args:
        num_classes: Number of output classes
        img_size: Input image size
        in_chans: Number of input channels
        segmentation: Enable segmentation head
        pretrained: Load pretrained weights
    
    Returns:
        MediVisionSwin model
    """
    model = MediVisionSwin(
        img_size=img_size,
        patch_size=4,
        in_chans=in_chans,
        num_classes=num_classes,
        embed_dim=96,
        depths=[2, 2, 6, 2],
        num_heads=[3, 6, 12, 24],
        window_size=7,
        segmentation=segmentation
    )
    
    # Load pretrained weights if requested
    # In production, load from checkpoint
    
    return model
