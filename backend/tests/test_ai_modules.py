"""
MediVision AI - AI Module Tests

Tests for AI processing modules.
"""

import pytest
import numpy as np


class TestImageProcessing:
    """Test image processing functions."""

    def test_window_presets_exist(self):
        """Test that window presets are defined."""
        from ai.image_processing.image_ops import WINDOW_PRESETS
        
        assert "lung" in WINDOW_PRESETS
        assert "brain" in WINDOW_PRESETS
        assert "bone" in WINDOW_PRESETS
        
        # Check preset structure
        lung = WINDOW_PRESETS["lung"]
        assert "center" in lung
        assert "width" in lung

    def test_apply_windowing(self):
        """Test windowing function."""
        from ai.image_processing.image_ops import apply_windowing
        
        # Create test image with HU values
        image = np.array([[-1000, 0, 40, 400, 1000]], dtype=np.float32)
        
        # Apply lung window (-600, 1500)
        result = apply_windowing(image, center=-600, width=1500)
        
        # Check output is normalized [0, 1]
        assert result.min() >= 0
        assert result.max() <= 1

    def test_normalize_volume(self):
        """Test volume normalization."""
        from ai.image_processing.image_ops import normalize_volume
        
        volume = np.random.rand(64, 128, 128) * 1000
        normalized = normalize_volume(volume)
        
        assert normalized.shape == volume.shape
        assert normalized.min() >= 0
        assert normalized.max() <= 1

    def test_detect_motion_blur(self):
        """Test blur detection."""
        from ai.image_processing.image_ops import detect_motion_blur
        
        # Sharp image (checkerboard pattern)
        sharp = np.zeros((100, 100), dtype=np.float32)
        sharp[::2, ::2] = 1
        sharp[1::2, 1::2] = 1
        
        # Blurry image (uniform)
        blurry = np.ones((100, 100), dtype=np.float32) * 0.5
        
        sharp_score = detect_motion_blur(sharp)
        blurry_score = detect_motion_blur(blurry)
        
        # Sharp should have higher score
        assert sharp_score > blurry_score


class TestSwinTransformer:
    """Test Swin Transformer model."""

    def test_model_creation(self):
        """Test model instantiation."""
        from ai.transformers.swin_medical import create_medivision_swin
        
        model = create_medivision_swin(
            img_size=224,
            num_classes=3,
            task="classification"
        )
        
        assert model is not None

    def test_forward_pass(self):
        """Test forward pass with dummy input."""
        from ai.transformers.swin_medical import create_medivision_swin
        import torch
        
        model = create_medivision_swin(
            img_size=224,
            num_classes=3,
            task="classification"
        )
        
        # Dummy batch
        x = torch.randn(2, 1, 224, 224)
        output = model(x)
        
        assert output["logits"].shape == (2, 3)

    def test_attention_extraction(self):
        """Test attention map extraction."""
        from ai.transformers.swin_medical import create_medivision_swin
        import torch
        
        model = create_medivision_swin(
            img_size=224,
            num_classes=3,
            task="classification"
        )
        
        x = torch.randn(1, 1, 224, 224)
        output = model(x)
        
        assert "attention_maps" in output


class TestCLIPModel:
    """Test CLIP multimodal model."""

    def test_model_creation(self):
        """Test model instantiation."""
        from ai.multimodal.clip_medical import create_medivision_clip
        
        model = create_medivision_clip()
        assert model is not None

    def test_encode_image(self):
        """Test image encoding."""
        from ai.multimodal.clip_medical import create_medivision_clip
        import torch
        
        model = create_medivision_clip()
        
        image = torch.randn(1, 1, 224, 224)
        embedding = model.encode_image(image)
        
        assert embedding.shape[1] == 512  # Embedding dimension

    def test_encode_text(self):
        """Test text encoding."""
        from ai.multimodal.clip_medical import create_medivision_clip
        
        model = create_medivision_clip()
        
        texts = ["Normal chest CT", "Pneumonia detected"]
        embeddings = model.encode_text(texts)
        
        assert embeddings.shape[0] == 2
        assert embeddings.shape[1] == 512


class TestReportGenerator:
    """Test LLM report generator."""

    def test_config_creation(self):
        """Test config creation."""
        from ai.llm.report_generator import ReportGenerationConfig
        
        config = ReportGenerationConfig()
        assert config.max_tokens > 0
        assert config.temperature >= 0

    def test_generate_report(self):
        """Test report generation."""
        from ai.llm.report_generator import ReportGenerator
        
        generator = ReportGenerator()
        
        findings = {
            "classification": "pneumonia",
            "confidence": 0.92,
            "location": "right_lower_lobe"
        }
        
        report = generator.generate(findings)
        
        assert "indication" in report
        assert "findings" in report
        assert "impression" in report


class TestSpeechPipeline:
    """Test speech transcription."""

    def test_transcriber_creation(self):
        """Test transcriber instantiation."""
        from ai.speech.transcription import create_transcriber
        
        transcriber = create_transcriber(model_size="base")
        assert transcriber is not None

    def test_command_recognition(self):
        """Test voice command recognition."""
        from ai.speech.transcription import VoiceCommandRecognizer
        
        recognizer = VoiceCommandRecognizer()
        
        # Test command parsing
        command = recognizer.parse_command("next slice")
        assert command is not None
        assert command["action"] == "navigate"

        command = recognizer.parse_command("toggle heatmap")
        assert command["action"] == "toggle"


class TestExplainability:
    """Test explainability module."""

    def test_gradcam_creation(self):
        """Test GradCAM instantiation."""
        from ai.explainability.visualizations import GradCAM
        
        gradcam = GradCAM(model=None, target_layer="layer4")
        assert gradcam is not None

    def test_attention_visualizer(self):
        """Test attention visualization."""
        from ai.explainability.visualizations import AttentionVisualizer
        
        viz = AttentionVisualizer(image_size=224, patch_size=16)
        
        # Create mock attention weights
        num_patches = (224 // 16) ** 2 + 1  # +1 for CLS token
        attention = [np.random.rand(8, num_patches, num_patches) for _ in range(4)]
        
        rollout = viz.compute_attention_rollout(attention)
        
        assert rollout.shape == (14, 14)  # Grid size

    def test_confidence_calibration(self):
        """Test confidence calibrator."""
        from ai.explainability.visualizations import ConfidenceCalibrator
        
        calibrator = ConfidenceCalibrator(temperature=1.0)
        
        logits = np.array([[2.0, 1.0, 0.5], [1.0, 3.0, 0.5]])
        probs = calibrator.apply_calibration(logits)
        
        # Probabilities should sum to 1
        np.testing.assert_almost_equal(probs.sum(axis=1), [1.0, 1.0])
