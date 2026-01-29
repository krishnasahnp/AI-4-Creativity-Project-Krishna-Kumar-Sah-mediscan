"""
Audio spectrogram generation and visualization utilities.
"""

import numpy as np
from typing import Optional, Tuple
import io
import base64


def generate_spectrogram(
    audio_data: np.ndarray,
    sample_rate: int = 16000,
    n_fft: int = 2048,
    hop_length: int = 512,
    n_mels: int = 128,
    fmin: float = 0,
    fmax: Optional[float] = None,
) -> Tuple[np.ndarray, dict]:
    """
    Generate mel spectrogram from audio data.
    
    Args:
        audio_data: Audio waveform as numpy array
        sample_rate: Audio sample rate
        n_fft: FFT window size
        hop_length: Hop length between frames
        n_mels: Number of mel bands
        fmin: Minimum frequency
        fmax: Maximum frequency (defaults to sample_rate/2)
    
    Returns:
        Tuple of (spectrogram array, metadata dict)
    """
    try:
        import librosa
        import librosa.display
    except ImportError:
        # Fallback to basic FFT-based spectrogram
        return _generate_basic_spectrogram(audio_data, sample_rate, n_fft, hop_length)
    
    if fmax is None:
        fmax = sample_rate / 2
    
    # Compute mel spectrogram
    mel_spec = librosa.feature.melspectrogram(
        y=audio_data,
        sr=sample_rate,
        n_fft=n_fft,
        hop_length=hop_length,
        n_mels=n_mels,
        fmin=fmin,
        fmax=fmax
    )
    
    # Convert to dB scale
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # Calculate metadata
    duration = len(audio_data) / sample_rate
    n_frames = mel_spec_db.shape[1]
    
    metadata = {
        "sample_rate": sample_rate,
        "duration": duration,
        "n_frames": n_frames,
        "n_mels": n_mels,
        "hop_length": hop_length,
        "time_resolution": hop_length / sample_rate,
        "freq_min": fmin,
        "freq_max": fmax,
        "db_range": {
            "min": float(mel_spec_db.min()),
            "max": float(mel_spec_db.max())
        }
    }
    
    return mel_spec_db, metadata


def _generate_basic_spectrogram(
    audio_data: np.ndarray,
    sample_rate: int,
    n_fft: int,
    hop_length: int
) -> Tuple[np.ndarray, dict]:
    """Basic spectrogram using numpy FFT"""
    # Compute STFT
    n_frames = 1 + (len(audio_data) - n_fft) // hop_length
    spectrogram = np.zeros((n_fft // 2 + 1, n_frames))
    
    window = np.hanning(n_fft)
    
    for i in range(n_frames):
        start = i * hop_length
        frame = audio_data[start:start + n_fft]
        if len(frame) < n_fft:
            frame = np.pad(frame, (0, n_fft - len(frame)))
        windowed = frame * window
        spectrum = np.abs(np.fft.rfft(windowed))
        spectrogram[:, i] = spectrum
    
    # Convert to dB
    spectrogram_db = 20 * np.log10(spectrogram + 1e-10)
    
    metadata = {
        "sample_rate": sample_rate,
        "duration": len(audio_data) / sample_rate,
        "n_frames": n_frames,
        "n_bins": n_fft // 2 + 1,
        "hop_length": hop_length
    }
    
    return spectrogram_db, metadata


def spectrogram_to_image(
    spectrogram: np.ndarray,
    width: int = 800,
    height: int = 200,
    colormap: str = "viridis"
) -> str:
    """
    Convert spectrogram to base64-encoded PNG image.
    
    Args:
        spectrogram: Spectrogram array (dB scale)
        width: Output image width
        height: Output image height
        colormap: Matplotlib colormap name
    
    Returns:
        Base64-encoded PNG image string
    """
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        from matplotlib import cm
    except ImportError:
        return _spectrogram_to_image_basic(spectrogram, width, height)
    
    # Normalize spectrogram
    spec_normalized = (spectrogram - spectrogram.min()) / (spectrogram.max() - spectrogram.min() + 1e-10)
    
    # Create figure
    fig, ax = plt.subplots(figsize=(width/100, height/100), dpi=100)
    ax.imshow(spec_normalized, aspect='auto', origin='lower', cmap=colormap)
    ax.axis('off')
    plt.tight_layout(pad=0)
    
    # Save to buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
    plt.close(fig)
    buf.seek(0)
    
    # Encode to base64
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"


def _spectrogram_to_image_basic(
    spectrogram: np.ndarray,
    width: int,
    height: int
) -> str:
    """Basic spectrogram image generation without matplotlib"""
    try:
        from PIL import Image
    except ImportError:
        return ""
    
    # Normalize to 0-255
    spec_normalized = (spectrogram - spectrogram.min()) / (spectrogram.max() - spectrogram.min() + 1e-10)
    spec_uint8 = (spec_normalized * 255).astype(np.uint8)
    
    # Flip vertically (low frequencies at bottom)
    spec_uint8 = np.flipud(spec_uint8)
    
    # Create image
    img = Image.fromarray(spec_uint8, mode='L')
    img = img.resize((width, height), Image.Resampling.LANCZOS)
    
    # Apply colormap (simple blue heatmap)
    img_rgb = Image.new('RGB', img.size)
    for x in range(img.width):
        for y in range(img.height):
            val = img.getpixel((x, y))
            # Blue to red colormap
            r = int(val * 1.0)
            g = int(val * 0.3)
            b = int(255 - val * 0.7)
            img_rgb.putpixel((x, y), (r, g, b))
    
    # Save to buffer
    buf = io.BytesIO()
    img_rgb.save(buf, format='PNG')
    buf.seek(0)
    
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"


def estimate_audio_quality(
    audio_data: np.ndarray,
    sample_rate: int = 16000
) -> dict:
    """
    Estimate audio quality metrics.
    
    Returns:
        Dict with quality metrics including SNR estimate and quality rating
    """
    # Calculate RMS energy
    rms = np.sqrt(np.mean(audio_data ** 2))
    
    # Estimate noise floor (using quietest 10% of frames)
    frame_size = int(0.025 * sample_rate)  # 25ms frames
    hop_size = int(0.010 * sample_rate)    # 10ms hop
    
    n_frames = (len(audio_data) - frame_size) // hop_size
    frame_energies = []
    
    for i in range(n_frames):
        start = i * hop_size
        frame = audio_data[start:start + frame_size]
        energy = np.sqrt(np.mean(frame ** 2))
        frame_energies.append(energy)
    
    if len(frame_energies) == 0:
        return {"quality": "unknown", "snr_estimate": 0, "rms": float(rms)}
    
    frame_energies = np.array(frame_energies)
    noise_floor = np.percentile(frame_energies, 10)
    signal_peak = np.percentile(frame_energies, 90)
    
    # Estimate SNR
    if noise_floor > 0:
        snr_estimate = 20 * np.log10(signal_peak / noise_floor)
    else:
        snr_estimate = 60  # Very clean
    
    # Determine quality rating
    if snr_estimate > 30:
        quality = "good"
    elif snr_estimate > 15:
        quality = "medium"
    else:
        quality = "poor"
    
    # Check for clipping
    clipping_ratio = np.mean(np.abs(audio_data) > 0.99)
    if clipping_ratio > 0.01:
        quality = "poor"  # More than 1% clipped
    
    return {
        "quality": quality,
        "snr_estimate": float(snr_estimate),
        "rms": float(rms),
        "noise_floor": float(noise_floor),
        "signal_peak": float(signal_peak),
        "clipping_ratio": float(clipping_ratio),
        "duration": len(audio_data) / sample_rate
    }


def load_audio_file(file_path: str, target_sr: int = 16000) -> Tuple[np.ndarray, int]:
    """
    Load audio file and resample if needed.
    
    Args:
        file_path: Path to audio file
        target_sr: Target sample rate
    
    Returns:
        Tuple of (audio_array, sample_rate)
    """
    try:
        import librosa
        audio, sr = librosa.load(file_path, sr=target_sr, mono=True)
        return audio, sr
    except ImportError:
        pass
    
    try:
        import soundfile as sf
        audio, sr = sf.read(file_path)
        if len(audio.shape) > 1:
            audio = audio.mean(axis=1)  # Convert to mono
        
        # Resample if needed
        if sr != target_sr:
            from scipy import signal
            num_samples = int(len(audio) * target_sr / sr)
            audio = signal.resample(audio, num_samples)
            sr = target_sr
        
        return audio.astype(np.float32), sr
    except ImportError:
        raise ImportError("Install librosa or soundfile to load audio files")
