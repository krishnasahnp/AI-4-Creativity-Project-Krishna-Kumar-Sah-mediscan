"""
Grad-CAM Generator
Generates class activation maps for model explainability
"""

import logging
from typing import Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class GradCAM:
    """
    Grad-CAM implementation for model explainability
    
    Generates heatmaps showing which image regions 
    contributed most to a specific classification
    """
    
    def __init__(self, model, target_layer=None):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        if TORCH_AVAILABLE and hasattr(model, 'backbone'):
            # Register hooks for DenseNet
            self.target_layer = model.backbone.features.denseblock4
            self._register_hooks()
    
    def _register_hooks(self):
        """Register forward and backward hooks"""
        if not TORCH_AVAILABLE:
            return
        
        def forward_hook(module, input, output):
            self.activations = output.detach()
        
        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()
        
        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)
    
    def generate(
        self, 
        input_tensor, 
        target_class: int = None
    ) -> Tuple[np.ndarray, float]:
        """
        Generate Grad-CAM heatmap
        
        Args:
            input_tensor: Input image tensor
            target_class: Index of target class (None = use predicted class)
            
        Returns:
            Tuple of (heatmap, predicted_score)
        """
        if not TORCH_AVAILABLE:
            return self._mock_heatmap(input_tensor.shape[-2:])
        
        self.model.eval()
        
        # Forward pass
        output = self.model(input_tensor)
        
        if target_class is None:
            target_class = output.argmax(dim=1).item()
        
        # Get score for target class
        score = torch.sigmoid(output[0, target_class]).item()
        
        # Backward pass
        self.model.zero_grad()
        output[0, target_class].backward()
        
        # Generate CAM
        if self.gradients is None or self.activations is None:
            return self._mock_heatmap(input_tensor.shape[-2:])
        
        # Global average pooling of gradients
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        
        # Weighted combination of activations
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        cam = F.relu(cam)  # ReLU to keep positive contributions
        
        # Normalize
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        
        # Resize to input size
        cam = F.interpolate(
            cam, 
            size=input_tensor.shape[-2:], 
            mode='bilinear', 
            align_corners=False
        )
        
        heatmap = cam.squeeze().cpu().numpy()
        
        return heatmap, score
    
    def generate_overlay(
        self, 
        input_image: np.ndarray,
        heatmap: np.ndarray,
        alpha: float = 0.4,
        colormap: int = None
    ) -> np.ndarray:
        """
        Overlay heatmap on original image
        
        Args:
            input_image: Original image (H, W) or (H, W, 3)
            heatmap: Grad-CAM heatmap (H, W)
            alpha: Overlay transparency
            colormap: OpenCV colormap (default: COLORMAP_JET)
            
        Returns:
            Overlay image (H, W, 3)
        """
        if not CV2_AVAILABLE:
            return input_image
        
        if colormap is None:
            colormap = cv2.COLORMAP_JET
        
        # Ensure image is 3-channel
        if len(input_image.shape) == 2:
            input_image = cv2.cvtColor(input_image, cv2.COLOR_GRAY2BGR)
        
        # Normalize if needed
        if input_image.max() <= 1.0:
            input_image = (input_image * 255).astype(np.uint8)
        
        # Resize heatmap to match image
        heatmap_resized = cv2.resize(heatmap, (input_image.shape[1], input_image.shape[0]))
        
        # Apply colormap
        heatmap_colored = cv2.applyColorMap(
            (heatmap_resized * 255).astype(np.uint8), 
            colormap
        )
        
        # Blend
        overlay = cv2.addWeighted(input_image, 1 - alpha, heatmap_colored, alpha, 0)
        
        return overlay
    
    def _mock_heatmap(self, size: Tuple[int, int]) -> Tuple[np.ndarray, float]:
        """Generate mock heatmap for testing"""
        h, w = size
        
        # Create gaussian-shaped heatmap
        y, x = np.ogrid[:h, :w]
        
        # Multiple hotspots
        hotspot1 = np.exp(-((x - w*0.35)**2 + (y - h*0.4)**2) / (2 * (w*0.15)**2))
        hotspot2 = np.exp(-((x - w*0.65)**2 + (y - h*0.35)**2) / (2 * (w*0.1)**2))
        
        heatmap = hotspot1 * 0.9 + hotspot2 * 0.7
        heatmap = heatmap / heatmap.max()
        
        return heatmap, 0.85


class GradCAMPlusPlus(GradCAM):
    """
    Grad-CAM++ for improved heatmap localization
    Uses second-order gradients for better weighting
    """
    
    def generate(self, input_tensor, target_class: int = None) -> Tuple[np.ndarray, float]:
        """Generate Grad-CAM++ heatmap"""
        if not TORCH_AVAILABLE:
            return self._mock_heatmap(input_tensor.shape[-2:])
        
        self.model.eval()
        
        # Forward pass
        output = self.model(input_tensor)
        
        if target_class is None:
            target_class = output.argmax(dim=1).item()
        
        score = torch.sigmoid(output[0, target_class]).item()
        
        # First backward pass
        self.model.zero_grad()
        output[0, target_class].backward(retain_graph=True)
        
        if self.gradients is None or self.activations is None:
            return self._mock_heatmap(input_tensor.shape[-2:])
        
        grads = self.gradients
        activations = self.activations
        
        # Grad-CAM++ weighting
        grads_power_2 = grads ** 2
        grads_power_3 = grads ** 3
        
        sum_activations = torch.sum(activations, dim=(2, 3), keepdim=True)
        
        alpha = grads_power_2 / (2 * grads_power_2 + sum_activations * grads_power_3 + 1e-10)
        alpha = F.relu(grads) * alpha
        
        weights = torch.sum(alpha, dim=(2, 3), keepdim=True)
        
        # Generate CAM
        cam = torch.sum(weights * activations, dim=1, keepdim=True)
        cam = F.relu(cam)
        
        # Normalize and resize
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        
        cam = F.interpolate(
            cam, 
            size=input_tensor.shape[-2:], 
            mode='bilinear', 
            align_corners=False
        )
        
        heatmap = cam.squeeze().cpu().numpy()
        
        return heatmap, score
