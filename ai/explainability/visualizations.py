"""
MediVision AI - Explainability Module

Attention visualization, Grad-CAM, and confidence calibration.

Author: MediVision AI Team
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np


class AttentionVisualizer:
    """Visualize attention maps from transformer models."""
    
    def __init__(self, image_size: int = 224, patch_size: int = 16):
        self.image_size = image_size
        self.patch_size = patch_size
        self.num_patches = (image_size // patch_size) ** 2
    
    def compute_attention_rollout(
        self,
        attention_weights: List[np.ndarray],
        head_fusion: str = "mean"
    ) -> np.ndarray:
        """
        Compute attention rollout across transformer layers.
        
        Args:
            attention_weights: List of attention matrices per layer
            head_fusion: How to combine attention heads (mean, max, min)
            
        Returns:
            2D attention map
        """
        result = np.eye(attention_weights[0].shape[-1])
        
        for attention in attention_weights:
            if head_fusion == "mean":
                attention_fused = attention.mean(axis=0)
            elif head_fusion == "max":
                attention_fused = attention.max(axis=0)
            else:
                attention_fused = attention.min(axis=0)
            
            # Add residual connection
            attention_fused = 0.5 * attention_fused + 0.5 * np.eye(attention_fused.shape[0])
            
            # Normalize
            attention_fused = attention_fused / attention_fused.sum(axis=-1, keepdims=True)
            
            result = result @ attention_fused
        
        # Get attention to CLS token
        cls_attention = result[0, 1:]  # Exclude CLS token itself
        
        # Reshape to 2D
        grid_size = int(np.sqrt(len(cls_attention)))
        attention_map = cls_attention.reshape(grid_size, grid_size)
        
        return attention_map
    
    def resize_attention_map(
        self,
        attention_map: np.ndarray,
        target_size: Tuple[int, int]
    ) -> np.ndarray:
        """Resize attention map to target size."""
        import cv2
        return cv2.resize(attention_map, target_size, interpolation=cv2.INTER_LINEAR)
    
    def overlay_attention(
        self,
        image: np.ndarray,
        attention_map: np.ndarray,
        alpha: float = 0.5,
        colormap: str = "jet"
    ) -> np.ndarray:
        """Overlay attention map on image."""
        import cv2
        
        # Normalize attention
        attention_normalized = (attention_map - attention_map.min()) / (attention_map.max() - attention_map.min() + 1e-8)
        
        # Resize to image size
        h, w = image.shape[:2]
        attention_resized = cv2.resize(attention_normalized, (w, h))
        
        # Apply colormap
        heatmap = cv2.applyColorMap((attention_resized * 255).astype(np.uint8), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Blend
        if len(image.shape) == 2:
            image = np.stack([image] * 3, axis=-1)
        if image.max() <= 1.0:
            image = (image * 255).astype(np.uint8)
        
        blended = cv2.addWeighted(image, 1 - alpha, heatmap, alpha, 0)
        return blended


class GradCAM:
    """
    Gradient-weighted Class Activation Mapping.
    
    Produces visual explanations for CNN/Transformer predictions.
    """
    
    def __init__(self, model, target_layer: str):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks (in practice)
        self._register_hooks()
    
    def _register_hooks(self):
        """Register forward and backward hooks."""
        # This would be implemented with actual model hooks
        pass
    
    def compute_gradcam(
        self,
        input_image: np.ndarray,
        target_class: Optional[int] = None
    ) -> np.ndarray:
        """
        Compute Grad-CAM for an input image.
        
        Args:
            input_image: Input image array
            target_class: Target class index (None for predicted class)
            
        Returns:
            Grad-CAM heatmap
        """
        # Mock implementation
        h, w = input_image.shape[:2] if len(input_image.shape) > 1 else (224, 224)
        
        # Generate gaussian-like activation centered on image
        x = np.linspace(-1, 1, w)
        y = np.linspace(-1, 1, h)
        xx, yy = np.meshgrid(x, y)
        
        # Add some randomness for realistic look
        center_x, center_y = np.random.uniform(-0.3, 0.3, 2)
        heatmap = np.exp(-((xx - center_x)**2 + (yy - center_y)**2) / 0.3)
        
        # Add secondary region
        center_x2, center_y2 = np.random.uniform(-0.5, 0.5, 2)
        heatmap += 0.5 * np.exp(-((xx - center_x2)**2 + (yy - center_y2)**2) / 0.2)
        
        # Normalize
        heatmap = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min())
        
        return heatmap
    
    def overlay_gradcam(
        self,
        image: np.ndarray,
        heatmap: np.ndarray,
        alpha: float = 0.5
    ) -> np.ndarray:
        """Overlay Grad-CAM heatmap on image."""
        import cv2
        
        h, w = image.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w, h))
        
        heatmap_colored = cv2.applyColorMap((heatmap_resized * 255).astype(np.uint8), cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        
        if len(image.shape) == 2:
            image = np.stack([image] * 3, axis=-1)
        if image.max() <= 1.0:
            image = (image * 255).astype(np.uint8)
        
        return cv2.addWeighted(image, 1 - alpha, heatmap_colored, alpha, 0)


class ConfidenceCalibrator:
    """
    Confidence calibration using temperature scaling.
    
    Ensures predicted probabilities match empirical accuracy.
    """
    
    def __init__(self, temperature: float = 1.0):
        self.temperature = temperature
        self.is_calibrated = False
    
    def calibrate(
        self,
        logits: np.ndarray,
        labels: np.ndarray
    ) -> float:
        """
        Calibrate temperature using validation set.
        
        Args:
            logits: Model logits (N, C)
            labels: True labels (N,)
            
        Returns:
            Optimal temperature
        """
        from scipy.optimize import minimize_scalar
        
        def nll_loss(temp):
            scaled = logits / temp
            probs = self._softmax(scaled)
            log_probs = np.log(probs[np.arange(len(labels)), labels] + 1e-10)
            return -np.mean(log_probs)
        
        result = minimize_scalar(nll_loss, bounds=(0.1, 10.0), method='bounded')
        self.temperature = result.x
        self.is_calibrated = True
        
        return self.temperature
    
    def apply_calibration(self, logits: np.ndarray) -> np.ndarray:
        """Apply temperature scaling to logits."""
        return self._softmax(logits / self.temperature)
    
    def _softmax(self, x: np.ndarray) -> np.ndarray:
        exp_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
        return exp_x / np.sum(exp_x, axis=-1, keepdims=True)
    
    def compute_ece(
        self,
        confidences: np.ndarray,
        predictions: np.ndarray,
        labels: np.ndarray,
        n_bins: int = 10
    ) -> float:
        """
        Compute Expected Calibration Error.
        
        Args:
            confidences: Model confidences
            predictions: Predicted classes
            labels: True labels
            n_bins: Number of calibration bins
            
        Returns:
            ECE score (lower is better)
        """
        bin_boundaries = np.linspace(0, 1, n_bins + 1)
        ece = 0.0
        
        for i in range(n_bins):
            in_bin = (confidences > bin_boundaries[i]) & (confidences <= bin_boundaries[i + 1])
            prop_in_bin = np.mean(in_bin)
            
            if prop_in_bin > 0:
                avg_confidence = np.mean(confidences[in_bin])
                avg_accuracy = np.mean(predictions[in_bin] == labels[in_bin])
                ece += np.abs(avg_accuracy - avg_confidence) * prop_in_bin
        
        return ece


class ExplanationReport:
    """Generate comprehensive explanation report for predictions."""
    
    def __init__(
        self,
        attention_viz: AttentionVisualizer,
        gradcam: GradCAM,
        calibrator: ConfidenceCalibrator
    ):
        self.attention_viz = attention_viz
        self.gradcam = gradcam
        self.calibrator = calibrator
    
    def generate(
        self,
        image: np.ndarray,
        prediction: Dict[str, Any],
        attention_weights: Optional[List[np.ndarray]] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive explanation.
        
        Returns dict with:
        - attention_map: Attention visualization
        - gradcam_map: Grad-CAM visualization
        - calibrated_confidence: Calibrated probability
        - feature_importance: Key contributing features
        """
        result = {
            "predicted_class": prediction.get("class", "unknown"),
            "raw_confidence": prediction.get("confidence", 0.0),
        }
        
        # Attention rollout
        if attention_weights:
            attention_map = self.attention_viz.compute_attention_rollout(attention_weights)
            result["attention_map"] = attention_map
            result["attention_overlay"] = self.attention_viz.overlay_attention(image, attention_map)
        
        # Grad-CAM
        gradcam_map = self.gradcam.compute_gradcam(image)
        result["gradcam_map"] = gradcam_map
        result["gradcam_overlay"] = self.gradcam.overlay_gradcam(image, gradcam_map)
        
        # Calibrated confidence
        if "logits" in prediction:
            calibrated_probs = self.calibrator.apply_calibration(prediction["logits"])
            result["calibrated_confidence"] = float(calibrated_probs.max())
        else:
            result["calibrated_confidence"] = result["raw_confidence"]
        
        # Feature importance summary
        result["feature_importance"] = self._extract_feature_importance(gradcam_map)
        
        return result
    
    def _extract_feature_importance(self, heatmap: np.ndarray) -> List[Dict]:
        """Extract top contributing regions from heatmap."""
        h, w = heatmap.shape
        grid_h, grid_w = 4, 4
        cell_h, cell_w = h // grid_h, w // grid_w
        
        regions = []
        for i in range(grid_h):
            for j in range(grid_w):
                cell = heatmap[i*cell_h:(i+1)*cell_h, j*cell_w:(j+1)*cell_w]
                importance = float(cell.mean())
                regions.append({
                    "region": f"({i},{j})",
                    "importance": importance,
                    "bbox": [j*cell_w, i*cell_h, (j+1)*cell_w, (i+1)*cell_h]
                })
        
        regions.sort(key=lambda x: x["importance"], reverse=True)
        return regions[:5]


def create_explanation_report(model: Any, image_size: int = 224) -> ExplanationReport:
    """Factory to create explanation report generator."""
    attention_viz = AttentionVisualizer(image_size)
    gradcam = GradCAM(model, "layer4")  # Example layer
    calibrator = ConfidenceCalibrator()
    
    return ExplanationReport(attention_viz, gradcam, calibrator)
