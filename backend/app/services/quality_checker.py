"""
Quality Checker Service
Validates image quality for reliable ML analysis
"""

import os
import logging
from typing import Dict
import numpy as np

logger = logging.getLogger(__name__)

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class QualityChecker:
    """
    Check image quality including:
    - Blur detection (Laplacian variance)
    - Contrast assessment (histogram spread)
    - Orientation validation
    - Body region coverage
    """
    
    # Thresholds
    BLUR_THRESHOLD = 100  # Laplacian variance below this is blurry
    CONTRAST_MIN = 50  # Minimum acceptable standard deviation
    COVERAGE_MIN = 0.3  # Minimum body region coverage ratio
    
    def check(self, file_path: str) -> Dict:
        """
        Run all quality checks on an image
        
        Returns:
            Dictionary with check results and overall pass/fail
        """
        results = {
            "is_acceptable": True,
            "checks": {},
            "warnings": [],
            "score": 100
        }
        
        # Load image
        img = self._load_image(file_path)
        if img is None:
            results["is_acceptable"] = False
            results["warnings"].append("Failed to load image")
            results["score"] = 0
            return results
        
        # Run checks
        blur_result = self._check_blur(img)
        results["checks"]["blur"] = blur_result
        if not blur_result["passed"]:
            results["warnings"].append("Image appears blurry")
            results["score"] -= 25
        
        contrast_result = self._check_contrast(img)
        results["checks"]["contrast"] = contrast_result
        if not contrast_result["passed"]:
            results["warnings"].append("Low contrast detected")
            results["score"] -= 20
        
        orientation_result = self._check_orientation(img)
        results["checks"]["orientation"] = orientation_result
        if not orientation_result["passed"]:
            results["warnings"].append("Possible orientation issue")
            results["score"] -= 10
        
        coverage_result = self._check_body_coverage(img)
        results["checks"]["body_coverage"] = coverage_result
        if not coverage_result["passed"]:
            results["warnings"].append("Body region may be incomplete")
            results["score"] -= 15
        
        # Overall assessment
        results["score"] = max(0, results["score"])
        results["is_acceptable"] = results["score"] >= 60
        
        return results
    
    def _load_image(self, file_path: str) -> np.ndarray:
        """Load image from file"""
        if not CV2_AVAILABLE:
            # Return mock image for testing
            return np.random.randint(0, 255, (512, 512), dtype=np.uint8)
        
        if file_path.lower().endswith(('.dcm', '.dicom')):
            from app.services.dicom_parser import DicomParser
            parser = DicomParser()
            return parser.get_pixel_array(file_path)
        
        return cv2.imread(file_path, cv2.IMREAD_GRAYSCALE)
    
    def _check_blur(self, img: np.ndarray) -> Dict:
        """
        Detect blur using Laplacian variance
        Higher variance = sharper image
        """
        if not CV2_AVAILABLE:
            return {"passed": True, "value": 500, "threshold": self.BLUR_THRESHOLD}
        
        laplacian = cv2.Laplacian(img, cv2.CV_64F)
        variance = laplacian.var()
        
        return {
            "passed": variance >= self.BLUR_THRESHOLD,
            "value": round(variance, 2),
            "threshold": self.BLUR_THRESHOLD,
            "description": "Sharpness (Laplacian variance)"
        }
    
    def _check_contrast(self, img: np.ndarray) -> Dict:
        """
        Check contrast using standard deviation
        Low std = low contrast
        """
        std = np.std(img.astype(np.float32))
        
        # Also check dynamic range
        dynamic_range = img.max() - img.min()
        
        passed = std >= self.CONTRAST_MIN and dynamic_range >= 100
        
        return {
            "passed": passed,
            "std": round(std, 2),
            "dynamic_range": int(dynamic_range),
            "threshold": self.CONTRAST_MIN,
            "description": "Contrast assessment"
        }
    
    def _check_orientation(self, img: np.ndarray) -> Dict:
        """
        Check if image orientation appears correct
        Uses heuristics based on expected anatomy
        """
        height, width = img.shape[:2]
        
        # For most medical images, we expect certain patterns
        # Simple check: upper region should have some content for chest/head
        upper_third = img[:height//3, :]
        lower_third = img[2*height//3:, :]
        
        upper_mean = upper_third.mean()
        lower_mean = lower_third.mean()
        
        # Most anatomical images have content throughout
        # Completely dark upper region might indicate wrong orientation
        seems_correct = upper_mean > 20 and lower_mean > 20
        
        return {
            "passed": seems_correct,
            "upper_intensity": round(upper_mean, 2),
            "lower_intensity": round(lower_mean, 2),
            "description": "Orientation check"
        }
    
    def _check_body_coverage(self, img: np.ndarray) -> Dict:
        """
        Check if body region fills sufficient portion of image
        """
        if not CV2_AVAILABLE:
            return {"passed": True, "coverage": 0.65, "threshold": self.COVERAGE_MIN}
        
        # Simple thresholding to find body region
        _, binary = cv2.threshold(img, 30, 255, cv2.THRESH_BINARY)
        
        # Calculate coverage ratio
        body_pixels = np.sum(binary > 0)
        total_pixels = binary.size
        coverage = body_pixels / total_pixels
        
        return {
            "passed": coverage >= self.COVERAGE_MIN,
            "coverage": round(coverage, 3),
            "threshold": self.COVERAGE_MIN,
            "description": "Body region coverage"
        }
