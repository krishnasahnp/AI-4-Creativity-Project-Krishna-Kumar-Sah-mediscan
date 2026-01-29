"""
MediVision AI - Multimodal Transformer for Image-Text Alignment

CLIP-style contrastive learning for medical image-report retrieval.

Author: MediVision AI Team
"""

from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F


class ImageEncoder(nn.Module):
    """Vision encoder for medical images."""
    
    def __init__(
        self,
        img_size: int = 224,
        patch_size: int = 16,
        in_chans: int = 1,
        embed_dim: int = 768,
        depth: int = 12,
        num_heads: int = 12,
        mlp_ratio: float = 4.0
    ):
        super().__init__()
        self.embed_dim = embed_dim
        num_patches = (img_size // patch_size) ** 2
        
        self.patch_embed = nn.Conv2d(in_chans, embed_dim, patch_size, patch_size)
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        
        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, mlp_ratio)
            for _ in range(depth)
        ])
        self.norm = nn.LayerNorm(embed_dim)
        
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B = x.shape[0]
        x = self.patch_embed(x).flatten(2).transpose(1, 2)
        
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)
        x = x + self.pos_embed
        
        for blk in self.blocks:
            x = blk(x)
        
        x = self.norm(x)
        return x[:, 0]  # Return CLS token


class TextEncoder(nn.Module):
    """Text encoder for medical reports."""
    
    def __init__(
        self,
        vocab_size: int = 30522,
        max_length: int = 512,
        embed_dim: int = 768,
        depth: int = 6,
        num_heads: int = 12,
        mlp_ratio: float = 4.0
    ):
        super().__init__()
        self.embed_dim = embed_dim
        
        self.token_embed = nn.Embedding(vocab_size, embed_dim)
        self.pos_embed = nn.Parameter(torch.zeros(1, max_length, embed_dim))
        
        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, mlp_ratio)
            for _ in range(depth)
        ])
        self.norm = nn.LayerNorm(embed_dim)
        
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
    
    def forward(self, x: torch.Tensor, attention_mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        x = self.token_embed(x)
        x = x + self.pos_embed[:, :x.shape[1]]
        
        for blk in self.blocks:
            x = blk(x)
        
        x = self.norm(x)
        
        # Mean pooling with attention mask
        if attention_mask is not None:
            mask = attention_mask.unsqueeze(-1)
            x = (x * mask).sum(dim=1) / mask.sum(dim=1)
        else:
            x = x.mean(dim=1)
        
        return x


class TransformerBlock(nn.Module):
    """Standard transformer block."""
    
    def __init__(self, dim: int, num_heads: int, mlp_ratio: float = 4.0):
        super().__init__()
        self.norm1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, num_heads, batch_first=True)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, int(dim * mlp_ratio)),
            nn.GELU(),
            nn.Linear(int(dim * mlp_ratio), dim)
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attn(self.norm1(x), self.norm1(x), self.norm1(x))[0]
        x = x + self.mlp(self.norm2(x))
        return x


class MediVisionCLIP(nn.Module):
    """
    CLIP-style model for medical image-text alignment.
    
    Enables:
    - Image-to-text retrieval (find similar reports)
    - Text-to-image retrieval (find similar cases)
    - Grounded report generation
    """
    
    def __init__(
        self,
        img_size: int = 224,
        in_chans: int = 1,
        vocab_size: int = 30522,
        embed_dim: int = 512,
        vision_depth: int = 12,
        text_depth: int = 6,
        num_heads: int = 8,
        temperature: float = 0.07
    ):
        super().__init__()
        
        self.image_encoder = ImageEncoder(
            img_size=img_size,
            in_chans=in_chans,
            embed_dim=embed_dim,
            depth=vision_depth,
            num_heads=num_heads
        )
        
        self.text_encoder = TextEncoder(
            vocab_size=vocab_size,
            embed_dim=embed_dim,
            depth=text_depth,
            num_heads=num_heads
        )
        
        self.image_proj = nn.Linear(embed_dim, embed_dim)
        self.text_proj = nn.Linear(embed_dim, embed_dim)
        
        self.logit_scale = nn.Parameter(torch.log(torch.tensor(1 / temperature)))
    
    def encode_image(self, image: torch.Tensor) -> torch.Tensor:
        """Encode image to embedding."""
        features = self.image_encoder(image)
        return F.normalize(self.image_proj(features), dim=-1)
    
    def encode_text(self, text: torch.Tensor, attention_mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        """Encode text to embedding."""
        features = self.text_encoder(text, attention_mask)
        return F.normalize(self.text_proj(features), dim=-1)
    
    def forward(
        self,
        images: torch.Tensor,
        texts: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None
    ) -> Dict[str, torch.Tensor]:
        """
        Forward pass with contrastive loss.
        
        Returns loss and similarity matrices.
        """
        image_embeds = self.encode_image(images)
        text_embeds = self.encode_text(texts, attention_mask)
        
        logit_scale = self.logit_scale.exp()
        logits_per_image = logit_scale * image_embeds @ text_embeds.t()
        logits_per_text = logits_per_image.t()
        
        # Contrastive loss (InfoNCE)
        labels = torch.arange(len(images), device=images.device)
        loss_i2t = F.cross_entropy(logits_per_image, labels)
        loss_t2i = F.cross_entropy(logits_per_text, labels)
        loss = (loss_i2t + loss_t2i) / 2
        
        return {
            'loss': loss,
            'logits_per_image': logits_per_image,
            'logits_per_text': logits_per_text,
            'image_embeds': image_embeds,
            'text_embeds': text_embeds
        }
    
    @torch.no_grad()
    def retrieve_similar_texts(
        self,
        image: torch.Tensor,
        text_embeds: torch.Tensor,
        top_k: int = 5
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Retrieve similar texts given an image.
        
        Args:
            image: Query image
            text_embeds: Pre-computed text embeddings database
            top_k: Number of results to return
        
        Returns:
            Indices and similarity scores
        """
        image_embed = self.encode_image(image)
        similarities = image_embed @ text_embeds.t()
        scores, indices = similarities.topk(top_k, dim=-1)
        return indices, scores
    
    @torch.no_grad()
    def retrieve_similar_images(
        self,
        text: torch.Tensor,
        image_embeds: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        top_k: int = 5
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Retrieve similar images given text.
        
        Args:
            text: Query text tokens
            image_embeds: Pre-computed image embeddings database
            attention_mask: Text attention mask
            top_k: Number of results to return
        
        Returns:
            Indices and similarity scores
        """
        text_embed = self.encode_text(text, attention_mask)
        similarities = text_embed @ image_embeds.t()
        scores, indices = similarities.topk(top_k, dim=-1)
        return indices, scores


class RetrievalIndex:
    """
    Index for fast similarity search.
    
    Maintains pre-computed embeddings for efficient retrieval.
    """
    
    def __init__(self, embed_dim: int = 512):
        self.embed_dim = embed_dim
        self.image_embeds: Optional[torch.Tensor] = None
        self.text_embeds: Optional[torch.Tensor] = None
        self.image_ids: List[str] = []
        self.text_ids: List[str] = []
    
    def add_images(self, embeds: torch.Tensor, ids: List[str]):
        """Add image embeddings to index."""
        if self.image_embeds is None:
            self.image_embeds = embeds
        else:
            self.image_embeds = torch.cat([self.image_embeds, embeds])
        self.image_ids.extend(ids)
    
    def add_texts(self, embeds: torch.Tensor, ids: List[str]):
        """Add text embeddings to index."""
        if self.text_embeds is None:
            self.text_embeds = embeds
        else:
            self.text_embeds = torch.cat([self.text_embeds, embeds])
        self.text_ids.extend(ids)
    
    def search_by_image(
        self,
        query_embed: torch.Tensor,
        top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """Search for similar texts by image."""
        if self.text_embeds is None:
            return []
        
        similarities = query_embed @ self.text_embeds.t()
        scores, indices = similarities.topk(min(top_k, len(self.text_ids)), dim=-1)
        
        results = []
        for idx, score in zip(indices[0].tolist(), scores[0].tolist()):
            results.append((self.text_ids[idx], score))
        return results
    
    def search_by_text(
        self,
        query_embed: torch.Tensor,
        top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """Search for similar images by text."""
        if self.image_embeds is None:
            return []
        
        similarities = query_embed @ self.image_embeds.t()
        scores, indices = similarities.topk(min(top_k, len(self.image_ids)), dim=-1)
        
        results = []
        for idx, score in zip(indices[0].tolist(), scores[0].tolist()):
            results.append((self.image_ids[idx], score))
        return results


def create_medivision_clip(
    img_size: int = 224,
    in_chans: int = 1,
    embed_dim: int = 512,
    pretrained: bool = False
) -> MediVisionCLIP:
    """Factory function to create MediVision CLIP model."""
    model = MediVisionCLIP(
        img_size=img_size,
        in_chans=in_chans,
        embed_dim=embed_dim
    )
    return model
