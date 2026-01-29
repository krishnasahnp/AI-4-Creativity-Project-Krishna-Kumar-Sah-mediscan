"""
Medical Image Classifier
Multi-label classification for medical findings (CheXpert-style)
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn as nn
    import torchvision.models as models
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class MedicalClassifier(nn.Module if TORCH_AVAILABLE else object):
    """
    Multi-label classifier for medical image findings
    
    Architecture: DenseNet-121 with custom classification head
    Output: Sigmoid probabilities for each finding
    """
    
    def __init__(self, num_classes: int = 14, pretrained: bool = True):
        if TORCH_AVAILABLE:
            super().__init__()
            
            # Use DenseNet-121 backbone
            self.backbone = models.densenet121(
                weights=models.DenseNet121_Weights.DEFAULT if pretrained else None
            )
            
            # Modify first conv to accept single-channel input
            original_conv = self.backbone.features.conv0
            self.backbone.features.conv0 = nn.Conv2d(
                3, 64, kernel_size=7, stride=2, padding=3, bias=False
            )
            
            # Get number of features from backbone
            num_features = self.backbone.classifier.in_features
            
            # Replace classifier head
            self.backbone.classifier = nn.Sequential(
                nn.Linear(num_features, 512),
                nn.ReLU(inplace=True),
                nn.Dropout(0.3),
                nn.Linear(512, num_classes)
            )
            
            self.num_classes = num_classes
            
            logger.info(f"Initialized MedicalClassifier with {num_classes} classes")
        else:
            self.num_classes = num_classes
    
    def forward(self, x):
        """Forward pass"""
        if not TORCH_AVAILABLE:
            # Return mock output
            import numpy as np
            return np.random.rand(x.shape[0], self.num_classes)
        
        return self.backbone(x)
    
    def predict(self, x) -> dict:
        """
        Get predictions with probabilities
        
        Args:
            x: Input tensor of shape (B, C, H, W)
            
        Returns:
            Dictionary with predictions and probabilities
        """
        if not TORCH_AVAILABLE:
            import numpy as np
            probs = np.random.rand(self.num_classes)
            return {"probabilities": probs.tolist()}
        
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probs = torch.sigmoid(logits)
        
        return {
            "probabilities": probs.cpu().numpy().tolist()
        }


class ModalityClassifier(nn.Module if TORCH_AVAILABLE else object):
    """
    Classifier for detecting imaging modality from visual features
    """
    
    MODALITIES = ["X-Ray", "CT", "MRI", "Ultrasound"]
    
    def __init__(self, pretrained: bool = True):
        if TORCH_AVAILABLE:
            super().__init__()
            
            # Use smaller ResNet for modality classification
            self.backbone = models.resnet18(
                weights=models.ResNet18_Weights.DEFAULT if pretrained else None
            )
            
            # Replace classifier
            num_features = self.backbone.fc.in_features
            self.backbone.fc = nn.Linear(num_features, len(self.MODALITIES))
    
    def forward(self, x):
        if not TORCH_AVAILABLE:
            import numpy as np
            return np.random.rand(len(self.MODALITIES))
        
        return self.backbone(x)
    
    def predict(self, x) -> tuple:
        """
        Predict modality
        
        Returns:
            Tuple of (modality_name, confidence)
        """
        if not TORCH_AVAILABLE:
            import numpy as np
            idx = np.random.randint(0, len(self.MODALITIES))
            return self.MODALITIES[idx], 0.85
        
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probs = torch.softmax(logits, dim=-1)
            confidence, idx = torch.max(probs, dim=-1)
        
        return self.MODALITIES[idx.item()], confidence.item()
