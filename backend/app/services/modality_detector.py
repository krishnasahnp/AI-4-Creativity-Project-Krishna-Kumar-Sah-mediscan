"""
Modality Detector Service
Auto-detects imaging modality (X-ray, CT, MRI, Ultrasound)
"""

import os
import logging
from typing import Tuple
import numpy as np

logger = logging.getLogger(__name__)

# Try to import CV2 and torch
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


class ModalityDetector:
    """
    Detect imaging modality using:
    1. DICOM header (if available)
    2. CNN-based visual classification (fallback)
    3. Heuristic analysis (last resort)
    """
    
    # Modality code mapping
    MODALITY_MAP = {
        "CR": "X-Ray",
        "DX": "X-Ray", 
        "XR": "X-Ray",
        "CT": "CT",
        "MR": "MRI",
        "MRI": "MRI",
        "US": "Ultrasound",
        "PT": "PET",
        "NM": "Nuclear Medicine",
    }
    
    def __init__(self):
        self.model = None
        self.transform = None
        
        if TORCH_AVAILABLE:
            self.transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485], std=[0.229])
            ])
    
    def detect(self, file_path: str, dicom_modality: str = None) -> Tuple[str, float]:
        """
        Detect modality from image file
        
        Returns:
            Tuple of (modality_name, confidence)
        """
        
        # 1. Use DICOM header if available
        if dicom_modality:
            modality = self.MODALITY_MAP.get(dicom_modality.upper(), dicom_modality)
            return modality, 1.0
        
        # 2. Try visual analysis
        try:
            return self._analyze_visual_features(file_path)
        except Exception as e:
            logger.warning(f"Visual analysis failed: {e}")
        
        # 3. Default fallback
        return "X-Ray", 0.5
    
    def _analyze_visual_features(self, file_path: str) -> Tuple[str, float]:
        """
        Analyze visual features to determine modality
        Uses heuristics based on image characteristics
        """
        if not CV2_AVAILABLE:
            return "X-Ray", 0.5
        
        # Load image
        if file_path.lower().endswith(('.dcm', '.dicom')):
            # For DICOM, use mock or pydicom
            from app.services.dicom_parser import DicomParser
            parser = DicomParser()
            img = parser.get_pixel_array(file_path)
        else:
            img = cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            return "Unknown", 0.0
        
        # Analyze image characteristics
        height, width = img.shape[:2]
        aspect_ratio = width / height
        
        # Calculate statistics
        mean_intensity = np.mean(img)
        std_intensity = np.std(img)
        
        # Histogram analysis
        hist = cv2.calcHist([img], [0], None, [256], [0, 256]).flatten()
        hist = hist / hist.sum()
        
        # Peak analysis
        peaks = np.argsort(hist)[-3:]  # Top 3 intensity peaks
        
        # Heuristic classification
        confidence = 0.7
        
        # Ultrasound: Often has characteristic "fan" shape and high contrast
        if self._is_ultrasound(img, hist):
            return "Ultrasound", confidence
        
        # CT: Usually square, specific HU range, uniform background
        if self._is_ct(img, aspect_ratio, mean_intensity):
            return "CT", confidence
        
        # MRI: High contrast between tissue types, usually square
        if self._is_mri(img, std_intensity, aspect_ratio):
            return "MRI", confidence
        
        # Default to X-ray
        return "X-Ray", 0.6
    
    def _is_ultrasound(self, img: np.ndarray, hist: np.ndarray) -> bool:
        """Check if image appears to be ultrasound"""
        # Ultrasound often has large dark regions and specular reflections
        dark_ratio = hist[:50].sum()
        
        # Check for fan shape (ultrasound probe pattern)
        height, width = img.shape[:2]
        top_row_mean = img[:height//10, width//4:3*width//4].mean()
        
        return dark_ratio > 0.4 and top_row_mean < 30
    
    def _is_ct(self, img: np.ndarray, aspect_ratio: float, mean_intensity: float) -> bool:
        """Check if image appears to be CT"""
        # CT images are typically square with specific intensity characteristics
        is_square = 0.9 <= aspect_ratio <= 1.1
        has_ct_intensity = 80 <= mean_intensity <= 180
        
        # Check for circular body region (CT cross-section)
        center_y, center_x = img.shape[0]//2, img.shape[1]//2
        center_region = img[center_y-50:center_y+50, center_x-50:center_x+50]
        center_std = np.std(center_region)
        
        return is_square and has_ct_intensity and center_std > 20
    
    def _is_mri(self, img: np.ndarray, std_intensity: float, aspect_ratio: float) -> bool:
        """Check if image appears to be MRI"""
        # MRI typically has high tissue contrast
        is_square = 0.9 <= aspect_ratio <= 1.1
        has_high_contrast = std_intensity > 50
        
        return is_square and has_high_contrast
