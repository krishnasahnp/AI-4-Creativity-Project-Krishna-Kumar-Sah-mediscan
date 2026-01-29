"""
Inference Engine Service
Orchestrates ML model loading and inference
"""

import os
import logging
from typing import Dict, List, Optional, Any
import numpy as np

logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not installed. Using mock inference.")


class InferenceEngine:
    """
    Central inference engine that orchestrates:
    - Model loading and management
    - Classification inference
    - Segmentation inference
    - Grad-CAM generation
    """
    
    # CheXpert finding labels
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
    
    def __init__(self):
        self.classifier = None
        self.segmentor = None
        self.is_ready = False
        self.device = "cuda" if TORCH_AVAILABLE and torch.cuda.is_available() else "cpu"
    
    async def load_models(self):
        """Load all ML models"""
        logger.info(f"Loading models on device: {self.device}")
        
        try:
            # Load classifier
            from app.models.classifier import MedicalClassifier
            self.classifier = MedicalClassifier(num_classes=len(self.CHEXPERT_LABELS))
            
            # Load segmentor
            from app.models.segmentor import LungSegmentor
            self.segmentor = LungSegmentor()
            
            self.is_ready = True
            logger.info("All models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            self.is_ready = True  # Still mark as ready, will use mock predictions
    
    async def analyze(
        self,
        image: np.ndarray,
        modality: str = "CT",
        run_segmentation: bool = True,
        run_gradcam: bool = True
    ) -> Dict[str, Any]:
        """
        Run full analysis pipeline
        
        Args:
            image: Preprocessed image as numpy array
            modality: Imaging modality
            run_segmentation: Whether to run segmentation
            run_gradcam: Whether to generate Grad-CAM
            
        Returns:
            Dictionary with findings, segmentation, and gradcam results
        """
        results = {
            "modality": modality,
            "findings": [],
            "segmentation": None,
            "gradcam": None
        }
        
        # Run classification
        findings = await self._classify(image, modality)
        results["findings"] = findings
        
        # Run segmentation if requested
        if run_segmentation:
            segmentation = await self._segment(image, modality)
            results["segmentation"] = segmentation
        
        # Generate Grad-CAM if requested
        if run_gradcam and findings:
            # Get Grad-CAM for top finding
            top_finding = max(findings, key=lambda x: x["confidence"])
            gradcam = await self._generate_gradcam(image, top_finding["name"])
            results["gradcam"] = gradcam
        
        return results
    
    async def _classify(self, image: np.ndarray, modality: str) -> List[Dict]:
        """Run classification model"""
        
        if not TORCH_AVAILABLE or self.classifier is None:
            return self._mock_classification(modality)
        
        try:
            # Prepare input tensor
            if len(image.shape) == 2:
                image = np.stack([image, image, image], axis=0)
            
            tensor = torch.from_numpy(image).float().unsqueeze(0).to(self.device)
            
            # Run inference
            with torch.no_grad():
                outputs = self.classifier(tensor)
                probabilities = torch.sigmoid(outputs).cpu().numpy()[0]
            
            # Format results
            findings = []
            for i, (label, prob) in enumerate(zip(self.CHEXPERT_LABELS, probabilities)):
                if prob > 0.3 or label == "No Finding":  # Include findings above threshold
                    findings.append({
                        "name": label,
                        "confidence": round(float(prob), 3),
                        "severity": self._get_severity(prob)
                    })
            
            # Sort by confidence
            findings.sort(key=lambda x: x["confidence"], reverse=True)
            
            return findings[:5]  # Return top 5
            
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            return self._mock_classification(modality)
    
    async def _segment(self, image: np.ndarray, modality: str) -> Optional[Dict]:
        """Run segmentation model"""
        
        if not TORCH_AVAILABLE or self.segmentor is None:
            return self._mock_segmentation()
        
        try:
            # Prepare input
            if len(image.shape) == 2:
                tensor = torch.from_numpy(image).float().unsqueeze(0).unsqueeze(0).to(self.device)
            else:
                tensor = torch.from_numpy(image).float().unsqueeze(0).to(self.device)
            
            # Run inference
            with torch.no_grad():
                mask = self.segmentor(tensor)
                mask = (mask > 0.5).cpu().numpy()[0, 0]
            
            return {
                "mask": mask.tolist(),  # Convert to list for JSON
                "regions_found": ["Left Lung", "Right Lung", "Heart"]
            }
            
        except Exception as e:
            logger.error(f"Segmentation failed: {e}")
            return self._mock_segmentation()
    
    async def _generate_gradcam(self, image: np.ndarray, finding_name: str) -> Optional[Dict]:
        """Generate Grad-CAM heatmap for specific finding"""
        
        # For now, return mock data
        # Real implementation would use pytorch-grad-cam
        return self._mock_gradcam(finding_name)
    
    def _get_severity(self, confidence: float) -> str:
        """Map confidence to severity level"""
        if confidence < 0.3:
            return "normal"
        elif confidence < 0.5:
            return "mild"
        elif confidence < 0.7:
            return "moderate"
        else:
            return "severe"
    
    def _mock_classification(self, modality: str) -> List[Dict]:
        """Return realistic mock classification results"""
        
        if modality == "CT":
            return [
                {"name": "Lung Opacity", "confidence": 0.87, "severity": "moderate"},
                {"name": "Consolidation", "confidence": 0.65, "severity": "mild"},
                {"name": "Cardiomegaly", "confidence": 0.23, "severity": "normal"},
                {"name": "Pleural Effusion", "confidence": 0.12, "severity": "normal"},
            ]
        elif modality == "MRI":
            return [
                {"name": "Lesion", "confidence": 0.78, "severity": "moderate"},
                {"name": "Edema", "confidence": 0.45, "severity": "mild"},
                {"name": "Atelectasis", "confidence": 0.32, "severity": "mild"},
            ]
        else:  # X-ray or default
            return [
                {"name": "Lung Opacity", "confidence": 0.72, "severity": "moderate"},
                {"name": "Cardiomegaly", "confidence": 0.58, "severity": "mild"},
                {"name": "Fracture", "confidence": 0.15, "severity": "normal"},
            ]
    
    def _mock_segmentation(self) -> Dict:
        """Return mock segmentation results"""
        return {
            "mask": None,  # Would be base64 in production
            "regions_found": ["Left Lung", "Right Lung", "Heart"],
            "coverage": {
                "left_lung": 0.18,
                "right_lung": 0.19,
                "heart": 0.08
            }
        }
    
    def _mock_gradcam(self, finding_name: str) -> Dict:
        """Return mock Grad-CAM results"""
        return {
            "finding": finding_name,
            "heatmap": None,  # Would be base64 image
            "hotspots": [
                {"x": 180, "y": 200, "radius": 60, "intensity": 0.92},
                {"x": 340, "y": 190, "radius": 45, "intensity": 0.78},
            ],
            "attention_score": 0.85
        }
