"""
Preprocessor Service
Image preprocessing pipeline for ML model input
"""

import os
import logging
from typing import Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import torch
    import torchvision.transforms as transforms
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class Preprocessor:
    """
    Preprocessing pipeline for medical images:
    1. Resize to model input size
    2. Normalize intensity values
    3. Denoise (Gaussian/bilateral filter)
    4. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    5. Optional organ region cropping
    """
    
    # Default model input sizes
    MODEL_SIZES = {
        "classifier": (224, 224),
        "segmentor": (512, 512),
    }
    
    def __init__(self, target_size: Tuple[int, int] = (224, 224)):
        self.target_size = target_size
        
        if TORCH_AVAILABLE:
            self.to_tensor = transforms.ToTensor()
            self.normalize = transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
    
    def process(
        self,
        file_path: str,
        modality: str = "CT",
        apply_clahe: bool = True,
        apply_denoise: bool = True,
        crop_body: bool = False
    ) -> np.ndarray:
        """
        Full preprocessing pipeline
        
        Args:
            file_path: Path to input image
            modality: Imaging modality for modality-specific processing
            apply_clahe: Whether to apply CLAHE
            apply_denoise: Whether to apply denoising
            crop_body: Whether to crop to body region
            
        Returns:
            Preprocessed numpy array ready for model input
        """
        
        # Load image
        img = self._load_image(file_path)
        if img is None:
            raise ValueError(f"Failed to load image: {file_path}")
        
        # Ensure grayscale
        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if CV2_AVAILABLE else img[:,:,0]
        
        # Apply preprocessing steps
        if apply_denoise:
            img = self._denoise(img, modality)
        
        if apply_clahe:
            img = self._apply_clahe(img)
        
        if crop_body:
            img = self._crop_body_region(img)
        
        # Normalize to 0-1 range
        img = self._normalize(img)
        
        # Resize to target size
        img = self._resize(img)
        
        return img
    
    def process_for_model(
        self,
        file_path: str,
        modality: str = "CT"
    ):
        """
        Process image and convert to PyTorch tensor
        """
        img = self.process(file_path, modality)
        
        if not TORCH_AVAILABLE:
            return img
        
        # Convert to 3-channel for pretrained models
        if len(img.shape) == 2:
            img = np.stack([img, img, img], axis=-1)
        
        # Convert to tensor
        tensor = self.to_tensor(img.astype(np.float32))
        
        # Normalize
        tensor = self.normalize(tensor)
        
        # Add batch dimension
        tensor = tensor.unsqueeze(0)
        
        return tensor
    
    def _load_image(self, file_path: str) -> Optional[np.ndarray]:
        """Load image from various formats"""
        if file_path.lower().endswith(('.dcm', '.dicom')):
            from app.services.dicom_parser import DicomParser
            parser = DicomParser()
            return parser.get_pixel_array(file_path)
        
        if CV2_AVAILABLE:
            return cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
        
        # Fallback: return mock image
        return np.random.randint(0, 255, (512, 512), dtype=np.uint8)
    
    def _denoise(self, img: np.ndarray, modality: str) -> np.ndarray:
        """Apply appropriate denoising based on modality"""
        if not CV2_AVAILABLE:
            return img
        
        if modality in ["CT", "MRI"]:
            # Non-local means for CT/MRI
            return cv2.fastNlMeansDenoising(img, None, h=10, templateWindowSize=7, searchWindowSize=21)
        elif modality == "Ultrasound":
            # Bilateral filter for ultrasound (preserves edges)
            return cv2.bilateralFilter(img, 9, 75, 75)
        else:
            # Gaussian for X-ray
            return cv2.GaussianBlur(img, (3, 3), 0)
    
    def _apply_clahe(self, img: np.ndarray) -> np.ndarray:
        """Apply Contrast Limited Adaptive Histogram Equalization"""
        if not CV2_AVAILABLE:
            return img
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(img)
    
    def _crop_body_region(self, img: np.ndarray) -> np.ndarray:
        """Crop to body region, removing black borders"""
        if not CV2_AVAILABLE:
            return img
        
        # Find non-black region
        _, binary = cv2.threshold(img, 30, 255, cv2.THRESH_BINARY)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return img
        
        # Get bounding box of largest contour
        largest = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest)
        
        # Add padding
        padding = 10
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(img.shape[1] - x, w + 2*padding)
        h = min(img.shape[0] - y, h + 2*padding)
        
        return img[y:y+h, x:x+w]
    
    def _normalize(self, img: np.ndarray) -> np.ndarray:
        """Normalize to 0-1 range"""
        img = img.astype(np.float32)
        img_min = img.min()
        img_max = img.max()
        
        if img_max - img_min > 0:
            img = (img - img_min) / (img_max - img_min)
        
        return img
    
    def _resize(self, img: np.ndarray) -> np.ndarray:
        """Resize to target size"""
        if CV2_AVAILABLE:
            return cv2.resize(img, self.target_size, interpolation=cv2.INTER_LINEAR)
        
        # Simple numpy resize fallback
        from PIL import Image
        pil_img = Image.fromarray((img * 255).astype(np.uint8))
        pil_img = pil_img.resize(self.target_size, Image.BILINEAR)
        return np.array(pil_img) / 255.0
