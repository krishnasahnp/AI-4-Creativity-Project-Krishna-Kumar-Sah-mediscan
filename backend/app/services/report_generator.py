"""
Report Generator Service
Generates visual report cards with findings, segmentation, and Grad-CAM
"""

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


# Report output directory
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


class ReportGenerator:
    """
    Generate visual report cards containing:
    - Original scan thumbnail
    - Findings list with confidence bars
    - Segmentation overlay
    - Grad-CAM heatmap
    - Key slice selection
    - Timestamp and study metadata
    """
    
    # Report dimensions
    REPORT_WIDTH = 1200
    REPORT_HEIGHT = 800
    
    # Colors
    COLORS = {
        "background": (15, 23, 42),  # Slate-900
        "card": (30, 41, 59),  # Slate-800
        "text": (248, 250, 252),  # Slate-50
        "text_secondary": (148, 163, 184),  # Slate-400
        "accent": (59, 130, 246),  # Blue-500
        "success": (34, 197, 94),  # Green-500
        "warning": (234, 179, 8),  # Yellow-500
        "error": (239, 68, 68),  # Red-500
    }
    
    def __init__(self):
        self.font = None
        self.font_bold = None
        self.font_small = None
        
        if PIL_AVAILABLE:
            try:
                # Try to load system font
                self.font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
                self.font_bold = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
                self.font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
            except Exception:
                self.font = ImageFont.load_default()
                self.font_bold = self.font
                self.font_small = self.font
    
    async def generate(
        self,
        image_id: str,
        include_gradcam: bool = True,
        include_segmentation: bool = True,
        output_format: str = "png"
    ) -> str:
        """
        Generate a visual report card
        
        Args:
            image_id: ID of the analyzed image
            include_gradcam: Whether to include Grad-CAM overlay
            include_segmentation: Whether to include segmentation mask
            output_format: Output format ("png" or "pdf")
            
        Returns:
            Path to generated report file
        """
        if not PIL_AVAILABLE:
            return self._generate_text_report(image_id)
        
        # Create report image
        report = Image.new("RGB", (self.REPORT_WIDTH, self.REPORT_HEIGHT), self.COLORS["background"])
        draw = ImageDraw.Draw(report)
        
        # Add header
        self._draw_header(draw, image_id)
        
        # Add scan image section
        self._draw_scan_section(draw, report, image_id)
        
        # Add findings section
        self._draw_findings_section(draw)
        
        # Add metrics section
        self._draw_metrics_section(draw)
        
        # Add footer
        self._draw_footer(draw)
        
        # Save report
        report_path = os.path.join(REPORTS_DIR, f"{image_id}_report.{output_format}")
        report.save(report_path)
        
        logger.info(f"Generated report: {report_path}")
        return report_path
    
    def _draw_header(self, draw: ImageDraw, image_id: str):
        """Draw report header"""
        # Title
        draw.text(
            (40, 30),
            "MediScan AI - Analysis Report",
            fill=self.COLORS["text"],
            font=self.font_bold
        )
        
        # Subtitle
        draw.text(
            (40, 60),
            f"Study ID: {image_id[:8]}... | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            fill=self.COLORS["text_secondary"],
            font=self.font_small
        )
        
        # Divider line
        draw.line([(40, 90), (self.REPORT_WIDTH - 40, 90)], fill=self.COLORS["card"], width=2)
    
    def _draw_scan_section(self, draw: ImageDraw, report: Image, image_id: str):
        """Draw scan image section with overlays"""
        # Section title
        draw.text(
            (40, 110),
            "📷 Scan Overview",
            fill=self.COLORS["accent"],
            font=self.font_bold
        )
        
        # Placeholder scan image
        scan_x, scan_y = 40, 140
        scan_size = 300
        
        # Draw scan placeholder
        draw.rectangle(
            [(scan_x, scan_y), (scan_x + scan_size, scan_y + scan_size)],
            fill=(20, 30, 50),
            outline=self.COLORS["card"],
            width=2
        )
        
        # Draw simulated scan
        self._draw_mock_scan(draw, scan_x, scan_y, scan_size)
        
        # Grad-CAM overlay section
        gradcam_x = scan_x + scan_size + 20
        draw.text(
            (gradcam_x, 140),
            "🔥 Attention Map (Grad-CAM)",
            fill=self.COLORS["accent"],
            font=self.font
        )
        
        # Grad-CAM placeholder
        draw.rectangle(
            [(gradcam_x, 170), (gradcam_x + scan_size, 170 + scan_size)],
            fill=(20, 30, 50),
            outline=self.COLORS["card"],
            width=2
        )
        self._draw_mock_gradcam(draw, gradcam_x, 170, scan_size)
    
    def _draw_mock_scan(self, draw: ImageDraw, x: int, y: int, size: int):
        """Draw mock CT scan image"""
        center_x = x + size // 2
        center_y = y + size // 2
        
        # Body outline
        draw.ellipse(
            [(center_x - 120, center_y - 130), (center_x + 120, center_y + 130)],
            fill=(60, 70, 90),
            outline=(80, 90, 110)
        )
        
        # Lung regions
        draw.ellipse(
            [(center_x - 100, center_y - 80), (center_x - 20, center_y + 60)],
            fill=(30, 40, 60)
        )
        draw.ellipse(
            [(center_x + 20, center_y - 80), (center_x + 100, center_y + 60)],
            fill=(30, 40, 60)
        )
        
        # Finding indicator
        draw.ellipse(
            [(center_x + 40, center_y - 30), (center_x + 70, center_y)],
            fill=self.COLORS["warning"],
            outline=self.COLORS["error"]
        )
    
    def _draw_mock_gradcam(self, draw: ImageDraw, x: int, y: int, size: int):
        """Draw mock Grad-CAM heatmap"""
        center_x = x + size // 2
        center_y = y + size // 2
        
        # Background
        draw.ellipse(
            [(center_x - 120, center_y - 130), (center_x + 120, center_y + 130)],
            fill=(40, 50, 70)
        )
        
        # Heatmap hotspots (simulated)
        # High attention area
        draw.ellipse(
            [(center_x + 20, center_y - 50), (center_x + 90, center_y + 20)],
            fill=(255, 100, 50)
        )
        draw.ellipse(
            [(center_x + 35, center_y - 35), (center_x + 75, center_y + 5)],
            fill=(255, 50, 50)
        )
        
        # Medium attention
        draw.ellipse(
            [(center_x - 80, center_y - 40), (center_x - 30, center_y + 10)],
            fill=(255, 180, 50)
        )
    
    def _draw_findings_section(self, draw: ImageDraw):
        """Draw findings with confidence bars"""
        section_x = 700
        section_y = 110
        
        draw.text(
            (section_x, section_y),
            "🔍 AI Findings",
            fill=self.COLORS["accent"],
            font=self.font_bold
        )
        
        # Mock findings
        findings = [
            ("Lung Opacity", 0.87, "moderate"),
            ("Consolidation", 0.65, "mild"),
            ("Cardiomegaly", 0.23, "normal"),
            ("Pleural Effusion", 0.12, "normal"),
        ]
        
        bar_width = 200
        bar_height = 20
        
        for i, (name, confidence, severity) in enumerate(findings):
            y_pos = section_y + 40 + i * 50
            
            # Finding name
            draw.text(
                (section_x, y_pos),
                name,
                fill=self.COLORS["text"],
                font=self.font
            )
            
            # Confidence bar background
            draw.rectangle(
                [(section_x, y_pos + 22), (section_x + bar_width, y_pos + 22 + bar_height)],
                fill=self.COLORS["card"]
            )
            
            # Confidence bar fill
            fill_width = int(bar_width * confidence)
            color = self._get_severity_color(severity)
            draw.rectangle(
                [(section_x, y_pos + 22), (section_x + fill_width, y_pos + 22 + bar_height)],
                fill=color
            )
            
            # Confidence percentage
            draw.text(
                (section_x + bar_width + 10, y_pos + 22),
                f"{int(confidence * 100)}%",
                fill=self.COLORS["text_secondary"],
                font=self.font_small
            )
    
    def _draw_metrics_section(self, draw: ImageDraw):
        """Draw quality and processing metrics"""
        section_x = 700
        section_y = 320
        
        draw.text(
            (section_x, section_y),
            "📊 Analysis Metrics",
            fill=self.COLORS["accent"],
            font=self.font_bold
        )
        
        metrics = [
            ("Image Quality", "Good", self.COLORS["success"]),
            ("Modality", "CT", self.COLORS["text"]),
            ("Body Region", "Chest", self.COLORS["text"]),
            ("Processing Time", "1.2s", self.COLORS["text_secondary"]),
        ]
        
        for i, (label, value, color) in enumerate(metrics):
            y_pos = section_y + 35 + i * 25
            draw.text((section_x, y_pos), f"{label}: ", fill=self.COLORS["text_secondary"], font=self.font_small)
            draw.text((section_x + 120, y_pos), value, fill=color, font=self.font_small)
    
    def _draw_footer(self, draw: ImageDraw):
        """Draw report footer with disclaimer"""
        footer_y = self.REPORT_HEIGHT - 60
        
        draw.line(
            [(40, footer_y), (self.REPORT_WIDTH - 40, footer_y)],
            fill=self.COLORS["card"],
            width=2
        )
        
        disclaimer = "⚠️ This analysis is generated by an AI system for educational and decision support purposes only. "
        disclaimer += "It is not a medical diagnosis. A qualified healthcare professional should always make final clinical decisions."
        
        draw.text(
            (40, footer_y + 15),
            disclaimer,
            fill=self.COLORS["text_secondary"],
            font=self.font_small
        )
    
    def _get_severity_color(self, severity: str) -> tuple:
        """Map severity to color"""
        if severity == "severe":
            return self.COLORS["error"]
        elif severity == "moderate":
            return self.COLORS["warning"]
        elif severity == "mild":
            return (250, 204, 21)  # Yellow-400
        else:
            return self.COLORS["success"]
    
    def _generate_text_report(self, image_id: str) -> str:
        """Generate text-based report when PIL is not available"""
        report_path = os.path.join(REPORTS_DIR, f"{image_id}_report.txt")
        
        content = f"""
================================================================================
                        MediScan AI - Analysis Report
================================================================================

Study ID: {image_id}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

--------------------------------------------------------------------------------
FINDINGS
--------------------------------------------------------------------------------

1. Lung Opacity
   Confidence: 87%
   Severity: Moderate
   
2. Consolidation
   Confidence: 65%
   Severity: Mild

3. Cardiomegaly
   Confidence: 23%
   Severity: Normal

4. Pleural Effusion
   Confidence: 12%
   Severity: Normal

--------------------------------------------------------------------------------
QUALITY METRICS
--------------------------------------------------------------------------------

Image Quality: Good
Modality: CT
Body Region: Chest
Processing Time: 1.2s

--------------------------------------------------------------------------------
DISCLAIMER
--------------------------------------------------------------------------------

This analysis is generated by an AI system for educational and decision 
support purposes only. It is not a medical diagnosis. A qualified healthcare 
professional should always make final clinical decisions.

================================================================================
"""
        
        with open(report_path, "w") as f:
            f.write(content)
        
        return report_path
