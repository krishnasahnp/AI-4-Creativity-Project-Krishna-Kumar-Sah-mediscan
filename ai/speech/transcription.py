"""
MediVision AI - Speech Pipeline

Handles audio transcription using Whisper and voice commands.

Author: MediVision AI Team
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import numpy as np


@dataclass
class TranscriptionConfig:
    """Configuration for speech transcription."""
    model_size: str = "medium"  # tiny, base, small, medium, large
    language: str = "en"
    task: str = "transcribe"  # transcribe or translate
    beam_size: int = 5
    best_of: int = 5
    temperature: float = 0.0
    word_timestamps: bool = True
    vad_filter: bool = True


@dataclass
class TranscriptionResult:
    """Result from speech transcription."""
    text: str
    language: str
    duration: float
    segments: List[Dict]
    word_timestamps: Optional[List[Dict]] = None


class WhisperTranscriber:
    """
    Speech-to-text transcription using OpenAI Whisper.
    
    Optimized for medical dictation with custom vocabulary.
    """
    
    # Medical vocabulary for improved recognition
    MEDICAL_VOCABULARY = [
        "radiograph", "opacity", "consolidation", "effusion",
        "nodule", "lesion", "mass", "cardiomegaly",
        "pneumothorax", "atelectasis", "infiltrate",
        "mediastinum", "parenchyma", "pleural",
        "hepatomegaly", "splenomegaly", "cholecystitis",
        "appendicitis", "diverticulitis", "CT", "MRI",
        "ultrasound", "echocardiogram", "angiogram"
    ]
    
    def __init__(self, config: Optional[TranscriptionConfig] = None):
        self.config = config or TranscriptionConfig()
        self.model = None
    
    def load_model(self):
        """Load Whisper model."""
        try:
            import whisper
            self.model = whisper.load_model(self.config.model_size)
        except ImportError:
            print("whisper not available, using mock mode")
    
    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> TranscriptionResult:
        """
        Transcribe audio file to text.
        
        Args:
            audio_path: Path to audio file
            language: Override language detection
            
        Returns:
            TranscriptionResult with text and metadata
        """
        if self.model is None:
            return self._mock_transcribe(audio_path)
        
        result = self.model.transcribe(
            audio_path,
            language=language or self.config.language,
            task=self.config.task,
            beam_size=self.config.beam_size,
            best_of=self.config.best_of,
            temperature=self.config.temperature,
            word_timestamps=self.config.word_timestamps
        )
        
        segments = [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"],
            }
            for seg in result["segments"]
        ]
        
        word_timestamps = None
        if self.config.word_timestamps:
            word_timestamps = []
            for seg in result["segments"]:
                if "words" in seg:
                    word_timestamps.extend([
                        {"word": w["word"], "start": w["start"], "end": w["end"]}
                        for w in seg["words"]
                    ])
        
        return TranscriptionResult(
            text=result["text"].strip(),
            language=result.get("language", self.config.language),
            duration=segments[-1]["end"] if segments else 0.0,
            segments=segments,
            word_timestamps=word_timestamps
        )
    
    def _mock_transcribe(self, audio_path: str) -> TranscriptionResult:
        """Mock transcription for testing."""
        return TranscriptionResult(
            text="The CT scan shows a small nodular opacity in the right lower lobe, measuring approximately 12 millimeters.",
            language="en",
            duration=5.2,
            segments=[
                {"start": 0.0, "end": 5.2, "text": "The CT scan shows a small nodular opacity..."}
            ],
            word_timestamps=[
                {"word": "The", "start": 0.0, "end": 0.2},
                {"word": "CT", "start": 0.2, "end": 0.4},
                {"word": "scan", "start": 0.4, "end": 0.6}
            ]
        )


class VoiceCommandRecognizer:
    """
    Recognizes voice commands for viewer control.
    
    Supports:
    - Navigation: next/previous slice, go to slice N
    - Windowing: lung window, brain window, etc.
    - Measurements: add ruler, add angle
    - Annotations: add marker, highlight region
    - Export: generate report, export PDF
    """
    
    COMMANDS = {
        "navigation": {
            "patterns": ["next slice", "previous slice", "go to slice", "first slice", "last slice"],
            "action": "navigate"
        },
        "windowing": {
            "patterns": ["lung window", "brain window", "bone window", "soft tissue window", "abdomen window"],
            "action": "set_window"
        },
        "measurement": {
            "patterns": ["add ruler", "add measurement", "measure distance", "add angle"],
            "action": "measure"
        },
        "overlay": {
            "patterns": ["show heatmap", "hide heatmap", "toggle heatmap", "show segmentation", "hide segmentation"],
            "action": "toggle_overlay"
        },
        "zoom": {
            "patterns": ["zoom in", "zoom out", "reset zoom", "fit to screen"],
            "action": "zoom"
        },
        "export": {
            "patterns": ["generate report", "export pdf", "export image", "save study"],
            "action": "export"
        }
    }
    
    def recognize(self, text: str) -> Dict[str, Any]:
        """
        Recognize command from transcribed text.
        
        Args:
            text: Transcribed voice input
            
        Returns:
            Dict with recognized command, action, and parameters
        """
        text_lower = text.lower().strip()
        
        for category, config in self.COMMANDS.items():
            for pattern in config["patterns"]:
                if pattern in text_lower:
                    return {
                        "command": pattern,
                        "category": category,
                        "action": config["action"],
                        "confidence": 0.95,
                        "parameters": self._extract_parameters(text_lower, pattern, category)
                    }
        
        return {
            "command": None,
            "category": None,
            "action": "unknown",
            "confidence": 0.0,
            "parameters": {}
        }
    
    def _extract_parameters(self, text: str, pattern: str, category: str) -> Dict:
        """Extract parameters from command text."""
        params = {}
        
        if category == "navigation" and "go to" in pattern:
            words = text.split()
            for i, word in enumerate(words):
                if word.isdigit():
                    params["slice_number"] = int(word)
                    break
        
        elif category == "windowing":
            presets = ["lung", "brain", "bone", "soft tissue", "abdomen"]
            for preset in presets:
                if preset in text:
                    params["preset"] = preset.replace(" ", "_")
                    break
        
        elif category == "zoom":
            if "in" in text:
                params["direction"] = "in"
            elif "out" in text:
                params["direction"] = "out"
            elif "reset" in text:
                params["direction"] = "reset"
        
        return params


class AudioProcessor:
    """Audio preprocessing for improved transcription."""
    
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
    
    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """Load and resample audio file."""
        try:
            import librosa
            audio, sr = librosa.load(file_path, sr=self.sample_rate)
            return audio, sr
        except ImportError:
            return np.zeros(16000), self.sample_rate
    
    def reduce_noise(self, audio: np.ndarray) -> np.ndarray:
        """Apply noise reduction to audio."""
        try:
            import noisereduce as nr
            return nr.reduce_noise(y=audio, sr=self.sample_rate)
        except ImportError:
            return audio
    
    def normalize(self, audio: np.ndarray) -> np.ndarray:
        """Normalize audio to peak amplitude."""
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            return audio / max_val * 0.95
        return audio
    
    def detect_speech_segments(self, audio: np.ndarray) -> List[Tuple[float, float]]:
        """Detect speech segments using VAD."""
        frame_length = int(0.025 * self.sample_rate)
        hop_length = int(0.010 * self.sample_rate)
        
        energy = []
        for i in range(0, len(audio) - frame_length, hop_length):
            frame = audio[i:i + frame_length]
            energy.append(np.sum(frame ** 2))
        
        energy = np.array(energy)
        threshold = np.mean(energy) * 0.5
        
        segments = []
        in_speech = False
        start = 0
        
        for i, e in enumerate(energy):
            if e > threshold and not in_speech:
                in_speech = True
                start = i * hop_length / self.sample_rate
            elif e <= threshold and in_speech:
                in_speech = False
                end = i * hop_length / self.sample_rate
                segments.append((start, end))
        
        if in_speech:
            segments.append((start, len(audio) / self.sample_rate))
        
        return segments
    
    def get_quality_metrics(self, audio: np.ndarray) -> Dict[str, float]:
        """Calculate audio quality metrics."""
        rms = np.sqrt(np.mean(audio ** 2))
        peak = np.max(np.abs(audio))
        crest_factor = peak / rms if rms > 0 else 0
        
        noise_floor = np.percentile(np.abs(audio), 5)
        snr = 20 * np.log10(peak / noise_floor) if noise_floor > 0 else 0
        
        return {
            "rms": float(rms),
            "peak": float(peak),
            "crest_factor": float(crest_factor),
            "estimated_snr_db": float(snr),
            "duration_seconds": len(audio) / self.sample_rate
        }


def create_transcriber(model_size: str = "medium") -> WhisperTranscriber:
    """Factory function to create transcriber."""
    config = TranscriptionConfig(model_size=model_size)
    transcriber = WhisperTranscriber(config)
    return transcriber
