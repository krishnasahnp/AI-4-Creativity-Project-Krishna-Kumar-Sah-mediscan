"""
Configuration and utilities for the ML backend
"""

import os
from typing import Dict, Any
from pydantic import BaseModel


class Settings(BaseModel):
    """Application settings"""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Directories
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    REPORTS_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "reports")
    WEIGHTS_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "weights")
    
    # Model settings
    MODEL_DEVICE: str = "cuda"  # or "cpu"
    CLASSIFIER_WEIGHTS: str = "densenet121_chexpert.pth"
    SEGMENTOR_WEIGHTS: str = "unet_lungs.pth"
    
    # Processing settings
    IMAGE_SIZE: int = 224
    BATCH_SIZE: int = 1
    
    # Thresholds
    FINDING_THRESHOLD: float = 0.3
    QUALITY_THRESHOLD: float = 60
    
    class Config:
        env_prefix = "MEDISCAN_"


# Create settings instance
settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.WEIGHTS_DIR, exist_ok=True)


# CheXpert label definitions
CHEXPERT_LABELS = [
    "No Finding",
    "Enlarged Cardiomediastinum", 
    "Cardiomegaly",
    "Lung Opacity",
    "Lung Lesion",
    "Edema",
    "Consolidation",
    "Pneumonia",
    "Atelectasis",
    "Pneumothorax",
    "Pleural Effusion",
    "Pleural Other",
    "Fracture",
    "Support Devices"
]

# Modality definitions
MODALITIES = {
    "CT": {
        "name": "Computed Tomography",
        "window_center": 40,
        "window_width": 400,
        "typical_findings": ["Lung Opacity", "Consolidation", "Pleural Effusion"]
    },
    "MRI": {
        "name": "Magnetic Resonance Imaging",
        "window_center": None,
        "window_width": None,
        "typical_findings": ["Lesion", "Edema", "Mass"]
    },
    "X-Ray": {
        "name": "X-Ray Radiography",
        "window_center": None,
        "window_width": None,
        "typical_findings": ["Cardiomegaly", "Pneumonia", "Fracture"]
    },
    "Ultrasound": {
        "name": "Ultrasonography",
        "window_center": None,
        "window_width": None,
        "typical_findings": ["Mass", "Cyst", "Calcification"]
    }
}


def get_severity_color(severity: str) -> str:
    """Get hex color for severity level"""
    colors = {
        "normal": "#22c55e",
        "mild": "#facc15",
        "moderate": "#f97316",
        "severe": "#ef4444"
    }
    return colors.get(severity, "#64748b")


def confidence_to_severity(confidence: float) -> str:
    """Map confidence score to severity level"""
    if confidence < 0.3:
        return "normal"
    elif confidence < 0.5:
        return "mild"
    elif confidence < 0.7:
        return "moderate"
    else:
        return "severe"
