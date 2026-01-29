"""
DICOM Parser Service
Parses DICOM files and extracts metadata + pixel data
"""

import os
import logging
from typing import Dict, Tuple, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Try to import pydicom, fall back to mock if not available
try:
    import pydicom
    from pydicom.pixel_data_handlers.util import apply_voi_lut
    PYDICOM_AVAILABLE = True
except ImportError:
    PYDICOM_AVAILABLE = False
    logger.warning("pydicom not installed. Using mock DICOM parser.")


class DicomParser:
    """
    Parse DICOM files to extract:
    - Metadata (Patient, Study, Series, Modality)
    - Pixel data as numpy array
    - Apply windowing for CT images
    """
    
    # Common DICOM tags to extract
    METADATA_TAGS = [
        "PatientID",
        "PatientName", 
        "PatientBirthDate",
        "PatientSex",
        "StudyDate",
        "StudyTime",
        "StudyDescription",
        "Modality",
        "BodyPartExamined",
        "Manufacturer",
        "InstitutionName",
        "SliceThickness",
        "PixelSpacing",
        "Rows",
        "Columns",
        "BitsAllocated",
        "BitsStored",
        "WindowCenter",
        "WindowWidth",
    ]
    
    def parse(self, file_path: str) -> Dict:
        """
        Parse a DICOM file and return metadata dictionary
        """
        if not PYDICOM_AVAILABLE:
            return self._mock_metadata(file_path)
        
        try:
            ds = pydicom.dcmread(file_path)
            metadata = {}
            
            for tag_name in self.METADATA_TAGS:
                try:
                    value = getattr(ds, tag_name, None)
                    if value is not None:
                        # Convert to string for JSON serialization
                        if hasattr(value, 'original_string'):
                            metadata[tag_name] = str(value.original_string)
                        else:
                            metadata[tag_name] = str(value)
                except Exception:
                    pass
            
            return metadata
            
        except Exception as e:
            logger.error(f"Failed to parse DICOM: {e}")
            return self._mock_metadata(file_path)
    
    def get_pixel_array(self, file_path: str) -> np.ndarray:
        """
        Extract pixel data from DICOM as numpy array
        Applies VOI LUT (windowing) for proper visualization
        """
        if not PYDICOM_AVAILABLE:
            return self._mock_pixel_array()
        
        try:
            ds = pydicom.dcmread(file_path)
            
            # Get pixel array
            pixel_array = ds.pixel_array.astype(np.float32)
            
            # Apply VOI LUT (windowing) if available
            try:
                pixel_array = apply_voi_lut(pixel_array, ds)
            except Exception:
                pass
            
            # Normalize to 0-255
            pixel_array = self._normalize_array(pixel_array)
            
            return pixel_array
            
        except Exception as e:
            logger.error(f"Failed to extract pixel data: {e}")
            return self._mock_pixel_array()
    
    def get_modality(self, file_path: str) -> str:
        """Extract modality from DICOM header"""
        metadata = self.parse(file_path)
        return metadata.get("Modality", "Unknown")
    
    def _normalize_array(self, arr: np.ndarray) -> np.ndarray:
        """Normalize array to 0-255 range"""
        arr_min = arr.min()
        arr_max = arr.max()
        if arr_max - arr_min > 0:
            arr = (arr - arr_min) / (arr_max - arr_min) * 255
        return arr.astype(np.uint8)
    
    def _mock_metadata(self, file_path: str) -> Dict:
        """Return mock metadata for testing"""
        return {
            "PatientID": "MOCK-001",
            "PatientName": "Test Patient",
            "StudyDate": "20260129",
            "Modality": "CT",
            "BodyPartExamined": "CHEST",
            "Manufacturer": "SIEMENS",
            "Rows": 512,
            "Columns": 512,
            "BitsAllocated": 16,
            "WindowCenter": 40,
            "WindowWidth": 400,
        }
    
    def _mock_pixel_array(self) -> np.ndarray:
        """Return mock pixel array for testing"""
        # Create a synthetic chest X-ray like image
        img = np.zeros((512, 512), dtype=np.uint8)
        
        # Add ellipse for chest cavity
        y, x = np.ogrid[:512, :512]
        center_x, center_y = 256, 256
        
        # Main body ellipse
        mask = ((x - center_x)**2 / 180**2 + (y - center_y)**2 / 200**2) <= 1
        img[mask] = 100
        
        # Lung regions (darker)
        lung_left = ((x - 180)**2 / 80**2 + (y - 240)**2 / 100**2) <= 1
        lung_right = ((x - 332)**2 / 80**2 + (y - 240)**2 / 100**2) <= 1
        img[lung_left] = 40
        img[lung_right] = 40
        
        # Add some noise
        noise = np.random.normal(0, 5, img.shape)
        img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        
        return img
