"""
Upload validation utilities for DICOM files and medical images.
Validates file integrity, metadata, and quality.
"""

import os
import struct
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import io
import hashlib


class ValidationSeverity(str, Enum):
    """Severity levels for validation issues"""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationCategory(str, Enum):
    """Categories of validation issues"""
    FILE_FORMAT = "file_format"
    DICOM_HEADER = "dicom_header"
    PIXEL_DATA = "pixel_data"
    METADATA = "metadata"
    SERIES = "series"
    QUALITY = "quality"


@dataclass
class ValidationIssue:
    """Represents a single validation issue"""
    severity: ValidationSeverity
    category: ValidationCategory
    code: str
    message: str
    location: Optional[str] = None
    suggestion: Optional[str] = None


@dataclass
class ValidationResult:
    """Complete validation result"""
    is_valid: bool
    file_path: str
    file_type: str
    issues: List[ValidationIssue]
    metadata: Dict[str, Any]
    quality_score: float
    
    def to_dict(self) -> dict:
        return {
            "is_valid": self.is_valid,
            "file_path": self.file_path,
            "file_type": self.file_type,
            "issues": [
                {
                    "severity": issue.severity.value,
                    "category": issue.category.value,
                    "code": issue.code,
                    "message": issue.message,
                    "location": issue.location,
                    "suggestion": issue.suggestion
                }
                for issue in self.issues
            ],
            "metadata": self.metadata,
            "quality_score": self.quality_score,
            "error_count": sum(1 for i in self.issues if i.severity == ValidationSeverity.ERROR),
            "warning_count": sum(1 for i in self.issues if i.severity == ValidationSeverity.WARNING)
        }


class DICOMValidator:
    """Validates DICOM files for integrity and completeness"""
    
    DICOM_MAGIC = b"DICM"
    DICOM_PREAMBLE_SIZE = 128
    
    # Required DICOM tags for medical imaging
    REQUIRED_TAGS = {
        (0x0008, 0x0060): "Modality",
        (0x0008, 0x0018): "SOP Instance UID",
        (0x0020, 0x000D): "Study Instance UID",
        (0x0020, 0x000E): "Series Instance UID",
        (0x0028, 0x0010): "Rows",
        (0x0028, 0x0011): "Columns",
    }
    
    RECOMMENDED_TAGS = {
        (0x0010, 0x0020): "Patient ID",
        (0x0008, 0x0020): "Study Date",
        (0x0008, 0x0030): "Study Time",
        (0x0018, 0x0050): "Slice Thickness",
        (0x0020, 0x0032): "Image Position",
        (0x0020, 0x0037): "Image Orientation",
        (0x0028, 0x0030): "Pixel Spacing",
    }
    
    def __init__(self):
        self.issues: List[ValidationIssue] = []
        self.metadata: Dict[str, Any] = {}
    
    def validate(self, file_path: str) -> ValidationResult:
        """Validate a single DICOM file"""
        self.issues = []
        self.metadata = {}
        
        if not os.path.exists(file_path):
            self.issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.FILE_FORMAT,
                code="FILE_NOT_FOUND",
                message=f"File not found: {file_path}"
            ))
            return self._create_result(file_path, False)
        
        # Check file size
        file_size = os.path.getsize(file_path)
        if file_size < 132:  # Minimum DICOM size
            self.issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.FILE_FORMAT,
                code="FILE_TOO_SMALL",
                message="File is too small to be a valid DICOM file",
                suggestion="Ensure the complete file was uploaded"
            ))
            return self._create_result(file_path, False)
        
        self.metadata["file_size"] = file_size
        
        # Validate DICOM structure
        try:
            with open(file_path, "rb") as f:
                self._validate_dicom_header(f)
                self._validate_required_tags(f)
                self._validate_pixel_data(f)
        except Exception as e:
            self.issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.FILE_FORMAT,
                code="PARSE_ERROR",
                message=f"Failed to parse DICOM file: {str(e)}"
            ))
        
        is_valid = not any(i.severity == ValidationSeverity.ERROR for i in self.issues)
        return self._create_result(file_path, is_valid)
    
    def _validate_dicom_header(self, f: io.BufferedReader):
        """Validate DICOM file header"""
        # Skip preamble
        f.seek(self.DICOM_PREAMBLE_SIZE)
        
        # Check DICM magic number
        magic = f.read(4)
        if magic != self.DICOM_MAGIC:
            self.issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.DICOM_HEADER,
                code="INVALID_MAGIC",
                message="Invalid DICOM header - missing DICM magic number",
                suggestion="File may be corrupted or not a DICOM file"
            ))
    
    def _validate_required_tags(self, f: io.BufferedReader):
        """Check for required DICOM tags (simplified check)"""
        # Note: Full implementation would use pydicom
        # This is a basic structural check
        f.seek(0)
        content = f.read()
        
        # Check for basic tag patterns
        has_modality = b"\x08\x00\x60\x00" in content or b"\x00\x08\x00\x60" in content
        has_pixel_data = b"\xe0\x7f\x10\x00" in content or b"\x7f\xe0\x00\x10" in content
        
        if not has_modality:
            self.issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category=ValidationCategory.METADATA,
                code="MISSING_MODALITY",
                message="Modality tag not detected",
                suggestion="Ensure DICOM contains valid modality information"
            ))
        
        if not has_pixel_data:
            self.issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category=ValidationCategory.PIXEL_DATA,
                code="MISSING_PIXEL_DATA",
                message="Pixel data tag not detected",
                suggestion="File may not contain image data"
            ))
    
    def _validate_pixel_data(self, f: io.BufferedReader):
        """Validate pixel data integrity"""
        f.seek(0, 2)  # Seek to end
        file_size = f.tell()
        
        # Check for reasonable image size
        if file_size < 10000:  # Very small for medical images
            self.issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category=ValidationCategory.QUALITY,
                code="SMALL_IMAGE",
                message="File size suggests low resolution image",
                suggestion="Check if complete image data is included"
            ))
    
    def _create_result(self, file_path: str, is_valid: bool) -> ValidationResult:
        """Create validation result"""
        quality_score = 1.0
        for issue in self.issues:
            if issue.severity == ValidationSeverity.ERROR:
                quality_score -= 0.3
            elif issue.severity == ValidationSeverity.WARNING:
                quality_score -= 0.1
        
        return ValidationResult(
            is_valid=is_valid,
            file_path=file_path,
            file_type="DICOM",
            issues=self.issues,
            metadata=self.metadata,
            quality_score=max(0, quality_score)
        )


class SeriesValidator:
    """Validates DICOM series for completeness"""
    
    def validate_series(
        self, 
        file_paths: List[str], 
        expected_count: Optional[int] = None
    ) -> ValidationResult:
        """Validate a complete DICOM series"""
        issues = []
        metadata = {"file_count": len(file_paths)}
        
        if len(file_paths) == 0:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.SERIES,
                code="EMPTY_SERIES",
                message="No files in series"
            ))
            return ValidationResult(
                is_valid=False,
                file_path="series",
                file_type="DICOM_SERIES",
                issues=issues,
                metadata=metadata,
                quality_score=0
            )
        
        # Check for missing slices
        if expected_count and len(file_paths) < expected_count:
            missing = expected_count - len(file_paths)
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.SERIES,
                code="MISSING_SLICES",
                message=f"Missing {missing} slices (expected {expected_count}, got {len(file_paths)})",
                suggestion="Ensure all DICOM files are uploaded"
            ))
        
        # Validate individual files
        dicom_validator = DICOMValidator()
        file_errors = 0
        for path in file_paths:
            result = dicom_validator.validate(path)
            if not result.is_valid:
                file_errors += 1
        
        if file_errors > 0:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category=ValidationCategory.SERIES,
                code="INVALID_FILES",
                message=f"{file_errors} files in series have validation issues"
            ))
        
        metadata["valid_files"] = len(file_paths) - file_errors
        metadata["invalid_files"] = file_errors
        
        is_valid = not any(i.severity == ValidationSeverity.ERROR for i in issues)
        quality_score = (len(file_paths) - file_errors) / len(file_paths) if file_paths else 0
        
        return ValidationResult(
            is_valid=is_valid,
            file_path="series",
            file_type="DICOM_SERIES",
            issues=issues,
            metadata=metadata,
            quality_score=quality_score
        )


class ImageValidator:
    """Validates standard image files (PNG, JPEG)"""
    
    PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
    JPEG_MAGIC = b"\xff\xd8\xff"
    
    def validate(self, file_path: str) -> ValidationResult:
        """Validate image file"""
        issues = []
        metadata = {}
        
        if not os.path.exists(file_path):
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.FILE_FORMAT,
                code="FILE_NOT_FOUND",
                message=f"File not found: {file_path}"
            ))
            return ValidationResult(
                is_valid=False,
                file_path=file_path,
                file_type="IMAGE",
                issues=issues,
                metadata=metadata,
                quality_score=0
            )
        
        file_size = os.path.getsize(file_path)
        metadata["file_size"] = file_size
        
        # Read file header
        with open(file_path, "rb") as f:
            header = f.read(16)
        
        # Detect image type
        if header.startswith(self.PNG_MAGIC):
            file_type = "PNG"
            self._validate_png(file_path, header, issues, metadata)
        elif header.startswith(self.JPEG_MAGIC):
            file_type = "JPEG"
            self._validate_jpeg(file_path, header, issues, metadata)
        else:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.FILE_FORMAT,
                code="UNKNOWN_FORMAT",
                message="Unsupported image format",
                suggestion="Upload PNG or JPEG images"
            ))
            file_type = "UNKNOWN"
        
        is_valid = not any(i.severity == ValidationSeverity.ERROR for i in issues)
        quality_score = 1.0 - (0.1 * len([i for i in issues if i.severity == ValidationSeverity.WARNING]))
        
        return ValidationResult(
            is_valid=is_valid,
            file_path=file_path,
            file_type=file_type,
            issues=issues,
            metadata=metadata,
            quality_score=max(0, quality_score)
        )
    
    def _validate_png(self, file_path: str, header: bytes, issues: List, metadata: Dict):
        """Validate PNG structure"""
        # Get dimensions from IHDR chunk
        try:
            with open(file_path, "rb") as f:
                f.seek(16)
                width = struct.unpack(">I", f.read(4))[0]
                height = struct.unpack(">I", f.read(4))[0]
                metadata["width"] = width
                metadata["height"] = height
                
                if width < 64 or height < 64:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        category=ValidationCategory.QUALITY,
                        code="LOW_RESOLUTION",
                        message=f"Image resolution ({width}x{height}) is very low",
                        suggestion="Upload higher resolution images for better analysis"
                    ))
        except Exception:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category=ValidationCategory.FILE_FORMAT,
                code="PARSE_WARNING",
                message="Could not read PNG dimensions"
            ))
    
    def _validate_jpeg(self, file_path: str, header: bytes, issues: List, metadata: Dict):
        """Validate JPEG structure"""
        # Check for valid JPEG markers
        try:
            with open(file_path, "rb") as f:
                f.seek(-2, 2)
                end_marker = f.read(2)
                if end_marker != b"\xff\xd9":
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        category=ValidationCategory.FILE_FORMAT,
                        code="TRUNCATED_JPEG",
                        message="JPEG may be truncated (missing end marker)",
                        suggestion="Re-upload the complete image file"
                    ))
        except Exception:
            pass


class AudioValidator:
    """Validates audio files for dictation"""
    
    WAV_MAGIC = b"RIFF"
    MP3_MAGIC = b"\xff\xfb"
    MP3_ID3 = b"ID3"
    
    def validate(self, file_path: str) -> ValidationResult:
        """Validate audio file"""
        issues = []
        metadata = {}
        
        if not os.path.exists(file_path):
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.FILE_FORMAT,
                code="FILE_NOT_FOUND",
                message=f"File not found: {file_path}"
            ))
            return ValidationResult(
                is_valid=False,
                file_path=file_path,
                file_type="AUDIO",
                issues=issues,
                metadata=metadata,
                quality_score=0
            )
        
        file_size = os.path.getsize(file_path)
        metadata["file_size"] = file_size
        
        with open(file_path, "rb") as f:
            header = f.read(16)
        
        # Detect audio type
        if header.startswith(self.WAV_MAGIC):
            file_type = "WAV"
            self._validate_wav(file_path, issues, metadata)
        elif header.startswith(self.MP3_MAGIC) or header.startswith(self.MP3_ID3):
            file_type = "MP3"
        else:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.FILE_FORMAT,
                code="UNKNOWN_FORMAT",
                message="Unsupported audio format",
                suggestion="Upload WAV or MP3 files"
            ))
            file_type = "UNKNOWN"
        
        # Check duration estimate
        if file_size < 10000:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category=ValidationCategory.QUALITY,
                code="SHORT_AUDIO",
                message="Audio file appears very short",
                suggestion="Ensure complete recording is uploaded"
            ))
        
        is_valid = not any(i.severity == ValidationSeverity.ERROR for i in issues)
        quality_score = 1.0 - (0.1 * len([i for i in issues if i.severity == ValidationSeverity.WARNING]))
        
        return ValidationResult(
            is_valid=is_valid,
            file_path=file_path,
            file_type=file_type,
            issues=issues,
            metadata=metadata,
            quality_score=max(0, quality_score)
        )
    
    def _validate_wav(self, file_path: str, issues: List, metadata: Dict):
        """Validate WAV file structure"""
        try:
            with open(file_path, "rb") as f:
                f.seek(22)
                channels = struct.unpack("<H", f.read(2))[0]
                sample_rate = struct.unpack("<I", f.read(4))[0]
                
                metadata["channels"] = channels
                metadata["sample_rate"] = sample_rate
                
                if sample_rate < 16000:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        category=ValidationCategory.QUALITY,
                        code="LOW_SAMPLE_RATE",
                        message=f"Low sample rate ({sample_rate} Hz) may affect transcription quality",
                        suggestion="Use 16kHz or higher for best transcription quality"
                    ))
        except Exception:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category=ValidationCategory.FILE_FORMAT,
                code="PARSE_WARNING",
                message="Could not read WAV metadata"
            ))


# Main validation function
def validate_upload(
    file_path: str,
    file_type: Optional[str] = None,
    expected_slices: Optional[int] = None
) -> ValidationResult:
    """
    Validate an uploaded file based on its type.
    
    Args:
        file_path: Path to the file
        file_type: Expected file type (auto-detected if not provided)
        expected_slices: Expected number of slices for DICOM series
    
    Returns:
        ValidationResult with validation status and issues
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    if file_type == "dicom" or ext in [".dcm", ".dicom"]:
        return DICOMValidator().validate(file_path)
    elif file_type == "image" or ext in [".png", ".jpg", ".jpeg"]:
        return ImageValidator().validate(file_path)
    elif file_type == "audio" or ext in [".wav", ".mp3"]:
        return AudioValidator().validate(file_path)
    else:
        # Try to detect
        validators = [DICOMValidator(), ImageValidator(), AudioValidator()]
        for validator in validators:
            result = validator.validate(file_path)
            if result.is_valid:
                return result
        
        # Return generic error
        return ValidationResult(
            is_valid=False,
            file_path=file_path,
            file_type="UNKNOWN",
            issues=[ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=ValidationCategory.FILE_FORMAT,
                code="UNKNOWN_FORMAT",
                message="Could not determine file type"
            )],
            metadata={},
            quality_score=0
        )
