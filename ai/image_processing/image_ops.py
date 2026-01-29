"""
MediVision AI - Medical Image Processing Toolkit

Comprehensive image processing functions for medical imaging including
DICOM handling, windowing, preprocessing, and quality assessment.

Author: MediVision AI Team
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image


def load_dicom_series(directory: str) -> Tuple[np.ndarray, Dict]:
    """
    Load a DICOM series from a directory.
    
    Args:
        directory: Path to directory containing DICOM files
        
    Returns:
        Tuple of (3D volume array, metadata dict)
    """
    try:
        import pydicom
        from pydicom.pixel_data_handlers.util import apply_voi_lut
    except ImportError:
        raise ImportError("pydicom is required for DICOM loading")
    
    dicom_files = []
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        try:
            ds = pydicom.dcmread(filepath)
            if hasattr(ds, 'pixel_array'):
                dicom_files.append(ds)
        except Exception:
            continue
    
    if not dicom_files:
        raise ValueError(f"No valid DICOM files found in {directory}")
    
    # Sort by slice location or instance number
    dicom_files = sort_slices_by_position(dicom_files)
    
    # Extract volume
    slices = []
    for ds in dicom_files:
        pixel_array = ds.pixel_array.astype(np.float32)
        # Apply rescale if available
        if hasattr(ds, 'RescaleSlope') and hasattr(ds, 'RescaleIntercept'):
            pixel_array = convert_to_hounsfield(
                pixel_array,
                ds.RescaleIntercept,
                ds.RescaleSlope
            )
        slices.append(pixel_array)
    
    volume = np.stack(slices, axis=0)
    
    # Extract metadata
    first_ds = dicom_files[0]
    metadata = {
        'patient_id': getattr(first_ds, 'PatientID', 'Unknown'),
        'study_date': getattr(first_ds, 'StudyDate', 'Unknown'),
        'modality': getattr(first_ds, 'Modality', 'Unknown'),
        'manufacturer': getattr(first_ds, 'Manufacturer', 'Unknown'),
        'slice_thickness': getattr(first_ds, 'SliceThickness', None),
        'pixel_spacing': list(getattr(first_ds, 'PixelSpacing', [1.0, 1.0])),
        'num_slices': len(dicom_files),
        'shape': volume.shape,
    }
    
    return volume, metadata


def sort_slices_by_position(slices: List) -> List:
    """
    Sort DICOM slices by ImagePositionPatient or InstanceNumber.
    
    Args:
        slices: List of pydicom Dataset objects
        
    Returns:
        Sorted list of slices
    """
    def get_position(ds):
        if hasattr(ds, 'ImagePositionPatient'):
            return float(ds.ImagePositionPatient[2])
        elif hasattr(ds, 'InstanceNumber'):
            return int(ds.InstanceNumber)
        elif hasattr(ds, 'SliceLocation'):
            return float(ds.SliceLocation)
        return 0
    
    return sorted(slices, key=get_position)


def convert_to_hounsfield(
    pixel_array: np.ndarray,
    intercept: float,
    slope: float
) -> np.ndarray:
    """
    Convert pixel values to Hounsfield Units (HU).
    
    HU = pixel_value * slope + intercept
    
    Args:
        pixel_array: Raw pixel values
        intercept: Rescale intercept from DICOM header
        slope: Rescale slope from DICOM header
        
    Returns:
        Array in Hounsfield Units
    """
    hu_image = pixel_array * slope + intercept
    return hu_image.astype(np.float32)


# ============================================================================
# Windowing Presets
# ============================================================================

WINDOW_PRESETS = {
    'lung': {'center': -600, 'width': 1500},
    'mediastinum': {'center': 40, 'width': 400},
    'soft_tissue': {'center': 40, 'width': 350},
    'liver': {'center': 60, 'width': 150},
    'bone': {'center': 400, 'width': 1800},
    'brain': {'center': 40, 'width': 80},
    'stroke': {'center': 32, 'width': 8},
    'subdural': {'center': 75, 'width': 215},
    'abdomen': {'center': 60, 'width': 400},
}


def apply_windowing(
    image: np.ndarray,
    center: float,
    width: float
) -> np.ndarray:
    """
    Apply window/level transformation to an image.
    
    Args:
        image: Input image (typically in HU)
        center: Window center (level)
        width: Window width
        
    Returns:
        Windowed image normalized to [0, 1]
    """
    min_val = center - width / 2
    max_val = center + width / 2
    
    windowed = np.clip(image, min_val, max_val)
    windowed = (windowed - min_val) / (max_val - min_val)
    
    return windowed.astype(np.float32)


def apply_window_preset(
    image: np.ndarray,
    preset: str
) -> np.ndarray:
    """
    Apply a named window preset.
    
    Args:
        image: Input image
        preset: Preset name (lung, brain, bone, etc.)
        
    Returns:
        Windowed image
    """
    if preset not in WINDOW_PRESETS:
        raise ValueError(f"Unknown preset: {preset}. Available: {list(WINDOW_PRESETS.keys())}")
    
    params = WINDOW_PRESETS[preset]
    return apply_windowing(image, params['center'], params['width'])


# ============================================================================
# Image Preprocessing
# ============================================================================

def resize_volume(
    volume: np.ndarray,
    target_shape: Tuple[int, int, int]
) -> np.ndarray:
    """
    Resize a 3D volume to target shape using trilinear interpolation.
    
    Args:
        volume: 3D numpy array (D, H, W)
        target_shape: Target shape (D, H, W)
        
    Returns:
        Resized volume
    """
    from scipy.ndimage import zoom
    
    factors = [t / s for t, s in zip(target_shape, volume.shape)]
    return zoom(volume, factors, order=1)


def normalize_volume(volume: np.ndarray) -> np.ndarray:
    """
    Normalize volume to zero mean and unit variance.
    
    Args:
        volume: Input volume
        
    Returns:
        Normalized volume
    """
    mean = np.mean(volume)
    std = np.std(volume)
    if std < 1e-8:
        std = 1.0
    return (volume - mean) / std


def normalize_to_range(
    image: np.ndarray,
    min_val: float = 0.0,
    max_val: float = 1.0
) -> np.ndarray:
    """
    Normalize image to a specific range.
    
    Args:
        image: Input image
        min_val: Target minimum value
        max_val: Target maximum value
        
    Returns:
        Normalized image
    """
    img_min = np.min(image)
    img_max = np.max(image)
    
    if img_max - img_min < 1e-8:
        return np.full_like(image, min_val)
    
    normalized = (image - img_min) / (img_max - img_min)
    return normalized * (max_val - min_val) + min_val


def center_crop(
    image: np.ndarray,
    crop_size: Tuple[int, int]
) -> np.ndarray:
    """
    Center crop a 2D image.
    
    Args:
        image: Input image (H, W) or (H, W, C)
        crop_size: Target size (H, W)
        
    Returns:
        Cropped image
    """
    h, w = image.shape[:2]
    th, tw = crop_size
    
    start_h = max(0, (h - th) // 2)
    start_w = max(0, (w - tw) // 2)
    
    return image[start_h:start_h+th, start_w:start_w+tw]


# ============================================================================
# Ultrasound Processing
# ============================================================================

def despeckle_median(
    image: np.ndarray,
    kernel_size: int = 5
) -> np.ndarray:
    """
    Apply median filter for ultrasound speckle reduction.
    
    Args:
        image: Input ultrasound image
        kernel_size: Filter kernel size
        
    Returns:
        Despeckled image
    """
    from scipy.ndimage import median_filter
    return median_filter(image, size=kernel_size)


def despeckle_bilateral(
    image: np.ndarray,
    d: int = 9,
    sigma_color: float = 75,
    sigma_space: float = 75
) -> np.ndarray:
    """
    Apply bilateral filter for edge-preserving speckle reduction.
    
    Args:
        image: Input ultrasound image
        d: Diameter of pixel neighborhood
        sigma_color: Filter sigma in color space
        sigma_space: Filter sigma in coordinate space
        
    Returns:
        Despeckled image
    """
    import cv2
    
    # Ensure image is in correct format
    if image.dtype != np.uint8:
        image = (normalize_to_range(image) * 255).astype(np.uint8)
    
    filtered = cv2.bilateralFilter(image, d, sigma_color, sigma_space)
    return filtered.astype(np.float32) / 255.0


def enhance_contrast_clahe(
    image: np.ndarray,
    clip_limit: float = 2.0,
    tile_grid_size: Tuple[int, int] = (8, 8)
) -> np.ndarray:
    """
    Apply CLAHE for contrast enhancement.
    
    Args:
        image: Input image
        clip_limit: Threshold for contrast limiting
        tile_grid_size: Size of grid for histogram equalization
        
    Returns:
        Contrast-enhanced image
    """
    import cv2
    
    # Convert to uint8 if needed
    if image.dtype != np.uint8:
        image_uint8 = (normalize_to_range(image) * 255).astype(np.uint8)
    else:
        image_uint8 = image
    
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    enhanced = clahe.apply(image_uint8)
    
    return enhanced.astype(np.float32) / 255.0


# ============================================================================
# Quality Assessment
# ============================================================================

def detect_motion_blur(image: np.ndarray) -> float:
    """
    Detect motion blur using Laplacian variance.
    
    Higher values indicate sharper images.
    
    Args:
        image: Input image
        
    Returns:
        Blur score (higher = sharper)
    """
    import cv2
    
    if image.dtype != np.uint8:
        image_uint8 = (normalize_to_range(image) * 255).astype(np.uint8)
    else:
        image_uint8 = image
    
    laplacian = cv2.Laplacian(image_uint8, cv2.CV_64F)
    variance = laplacian.var()
    
    return float(variance)


def assess_contrast(image: np.ndarray) -> float:
    """
    Assess image contrast using standard deviation.
    
    Args:
        image: Input image
        
    Returns:
        Contrast score
    """
    return float(np.std(image))


def count_missing_slices(
    positions: List[float],
    tolerance: float = 0.5
) -> int:
    """
    Count missing slices in a CT series.
    
    Args:
        positions: List of slice positions
        tolerance: Tolerance for detecting gaps
        
    Returns:
        Number of missing slices
    """
    if len(positions) < 2:
        return 0
    
    positions = sorted(positions)
    diffs = np.diff(positions)
    
    median_spacing = np.median(diffs)
    
    missing = 0
    for diff in diffs:
        expected_slices = round(diff / median_spacing) - 1
        if expected_slices > 0:
            missing += int(expected_slices)
    
    return missing


def estimate_ultrasound_noise(image: np.ndarray) -> float:
    """
    Estimate noise level in ultrasound image.
    
    Uses median absolute deviation of Laplacian.
    
    Args:
        image: Input ultrasound image
        
    Returns:
        Noise estimate
    """
    import cv2
    
    if image.dtype != np.uint8:
        image_uint8 = (normalize_to_range(image) * 255).astype(np.uint8)
    else:
        image_uint8 = image
    
    laplacian = cv2.Laplacian(image_uint8, cv2.CV_64F)
    sigma = np.median(np.abs(laplacian)) / 0.6745
    
    return float(sigma)


# ============================================================================
# Visualization Export
# ============================================================================

def export_preview_png(
    volume: np.ndarray,
    slice_idx: int,
    output_path: str,
    window_preset: Optional[str] = None
) -> None:
    """
    Export a slice as PNG preview.
    
    Args:
        volume: 3D volume
        slice_idx: Slice index to export
        output_path: Output file path
        window_preset: Optional window preset to apply
    """
    slice_img = volume[slice_idx]
    
    if window_preset:
        slice_img = apply_window_preset(slice_img, window_preset)
    else:
        slice_img = normalize_to_range(slice_img)
    
    # Convert to uint8
    slice_uint8 = (slice_img * 255).astype(np.uint8)
    
    # Save
    img = Image.fromarray(slice_uint8)
    img.save(output_path)


def overlay_mask(
    image: np.ndarray,
    mask: np.ndarray,
    color: Tuple[int, int, int] = (255, 0, 0),
    alpha: float = 0.5
) -> np.ndarray:
    """
    Overlay a segmentation mask on an image.
    
    Args:
        image: Background image (grayscale or RGB)
        mask: Binary mask
        color: Overlay color (R, G, B)
        alpha: Overlay transparency
        
    Returns:
        Image with mask overlay
    """
    # Convert to RGB if grayscale
    if len(image.shape) == 2:
        image = np.stack([image] * 3, axis=-1)
    
    # Normalize if needed
    if image.max() <= 1.0:
        image = (image * 255).astype(np.uint8)
    
    # Create overlay
    overlay = image.copy()
    mask_bool = mask > 0.5
    
    for c in range(3):
        overlay[:, :, c] = np.where(
            mask_bool,
            (1 - alpha) * image[:, :, c] + alpha * color[c],
            image[:, :, c]
        )
    
    return overlay.astype(np.uint8)


def generate_heatmap(
    attention_map: np.ndarray,
    colormap: str = 'jet'
) -> np.ndarray:
    """
    Generate a heatmap visualization from attention map.
    
    Args:
        attention_map: 2D attention/activation map
        colormap: Matplotlib colormap name
        
    Returns:
        RGB heatmap image
    """
    import cv2
    
    # Normalize to 0-255
    normalized = normalize_to_range(attention_map)
    heatmap = (normalized * 255).astype(np.uint8)
    
    # Apply colormap
    heatmap_colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    
    # Convert BGR to RGB
    heatmap_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    return heatmap_rgb


def blend_heatmap(
    image: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.4
) -> np.ndarray:
    """
    Blend heatmap with original image.
    
    Args:
        image: Original image (grayscale or RGB)
        heatmap: Heatmap to overlay
        alpha: Heatmap transparency
        
    Returns:
        Blended image
    """
    # Convert grayscale to RGB
    if len(image.shape) == 2:
        image = np.stack([image] * 3, axis=-1)
    
    # Normalize
    if image.max() <= 1.0:
        image = (image * 255).astype(np.uint8)
    
    # Resize heatmap if needed
    if heatmap.shape[:2] != image.shape[:2]:
        import cv2
        heatmap = cv2.resize(heatmap, (image.shape[1], image.shape[0]))
    
    # Blend
    blended = (1 - alpha) * image + alpha * heatmap
    return blended.astype(np.uint8)
