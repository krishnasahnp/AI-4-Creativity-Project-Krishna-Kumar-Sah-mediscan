"""
MediVision AI - LLM Fine-tuning for Radiology Report Generation

LoRA-based fine-tuning of LLMs for structured medical report generation.

Author: MediVision AI Team
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import json


@dataclass
class ReportGenerationConfig:
    """Configuration for report generation model."""
    base_model: str = "mistralai/Mistral-7B-Instruct-v0.2"
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    target_modules: List[str] = field(default_factory=lambda: ["q_proj", "v_proj", "k_proj", "o_proj"])
    max_length: int = 2048
    temperature: float = 0.3
    top_p: float = 0.9


SYSTEM_PROMPT = """You are a radiologist assistant. Generate structured radiology reports based only on provided findings. Include uncertainty when confidence is below 0.85. End with a disclaimer."""


def create_report_prompt(
    predictions: Dict[str, Any],
    measurements: Optional[Dict[str, Any]] = None,
    similar_cases: Optional[List[Dict]] = None,
    modality: str = "CT"
) -> str:
    """Create prompt for report generation."""
    prompt_parts = [f"Generate a structured {modality} radiology report.\n\n"]
    
    prompt_parts.append("## AI Predictions\n")
    for key, value in predictions.items():
        if isinstance(value, dict):
            prompt_parts.append(f"- {key}: {value.get('label', 'Unknown')} (confidence: {value.get('confidence', 0):.2f})\n")
        else:
            prompt_parts.append(f"- {key}: {value}\n")
    
    if measurements:
        prompt_parts.append("\n## Measurements\n")
        for key, value in measurements.items():
            prompt_parts.append(f"- {key}: {value}\n")
    
    if similar_cases:
        prompt_parts.append("\n## Similar Cases (Reference)\n")
        for i, case in enumerate(similar_cases[:3], 1):
            prompt_parts.append(f"{i}. Similarity: {case.get('score', 0):.2f} - {case.get('summary', 'No summary')}\n")
    
    prompt_parts.append("\n## Required Sections\n1. INDICATION\n2. TECHNIQUE\n3. FINDINGS\n4. IMPRESSION\n5. RECOMMENDATIONS\n")
    
    return "".join(prompt_parts)


def format_training_sample(
    findings: Dict[str, Any],
    report: Dict[str, str]
) -> Dict[str, str]:
    """Format a training sample for instruction fine-tuning."""
    instruction = create_report_prompt(findings)
    
    response_parts = []
    for section in ["indication", "technique", "findings", "impression", "recommendations"]:
        if section in report and report[section]:
            response_parts.append(f"**{section.upper()}**\n{report[section]}\n")
    
    response_parts.append("\n---\n*AI-assisted report. Clinical verification required.*")
    
    return {
        "instruction": instruction,
        "response": "\n".join(response_parts)
    }


class ReportGenerator:
    """Report generation using fine-tuned LLM."""
    
    def __init__(self, config: Optional[ReportGenerationConfig] = None):
        self.config = config or ReportGenerationConfig()
        self.model = None
        self.tokenizer = None
    
    def load_model(self, checkpoint_path: Optional[str] = None):
        """Load base model with optional LoRA weights."""
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            from peft import PeftModel
            
            self.tokenizer = AutoTokenizer.from_pretrained(self.config.base_model)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.config.base_model,
                torch_dtype="auto",
                device_map="auto"
            )
            
            if checkpoint_path:
                self.model = PeftModel.from_pretrained(self.model, checkpoint_path)
        except ImportError:
            print("transformers/peft not available, using mock mode")
    
    def generate_report(
        self,
        predictions: Dict[str, Any],
        measurements: Optional[Dict] = None,
        similar_cases: Optional[List[Dict]] = None,
        modality: str = "CT"
    ) -> Dict[str, str]:
        """Generate structured report from predictions."""
        prompt = create_report_prompt(predictions, measurements, similar_cases, modality)
        
        if self.model is None:
            return self._mock_generate(predictions, modality)
        
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=self.config.max_length,
            temperature=self.config.temperature,
            top_p=self.config.top_p,
            do_sample=True,
            pad_token_id=self.tokenizer.eos_token_id
        )
        
        generated = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return self._parse_report(generated)
    
    def _mock_generate(self, predictions: Dict, modality: str) -> Dict[str, str]:
        """Generate mock report when model unavailable."""
        finding_text = ", ".join([f"{k}: {v}" for k, v in predictions.items()])
        
        return {
            "indication": f"{modality} imaging performed for clinical evaluation.",
            "technique": f"Standard {modality} imaging protocol.",
            "findings": f"AI analysis indicates: {finding_text}. Clinical correlation recommended.",
            "impression": "Findings as described above. AI-assisted analysis - verify clinically.",
            "recommendations": "Clinical correlation and follow-up as clinically indicated.",
            "disclaimer": "This report was generated with AI assistance. Not for clinical use without physician review."
        }
    
    def _parse_report(self, text: str) -> Dict[str, str]:
        """Parse generated text into report sections."""
        sections = {}
        current_section = None
        current_content = []
        
        for line in text.split('\n'):
            line_upper = line.strip().upper()
            for section in ["INDICATION", "TECHNIQUE", "FINDINGS", "IMPRESSION", "RECOMMENDATIONS"]:
                if section in line_upper:
                    if current_section:
                        sections[current_section] = '\n'.join(current_content).strip()
                    current_section = section.lower()
                    current_content = []
                    break
            else:
                if current_section:
                    current_content.append(line)
        
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        sections["disclaimer"] = "AI-assisted report. Clinical verification required."
        return sections


def get_training_config() -> Dict[str, Any]:
    """Get training configuration for LoRA fine-tuning."""
    return {
        "lora_config": {
            "r": 16,
            "lora_alpha": 32,
            "lora_dropout": 0.05,
            "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
            "task_type": "CAUSAL_LM"
        },
        "training_args": {
            "output_dir": "./models/report_generator",
            "num_train_epochs": 3,
            "per_device_train_batch_size": 4,
            "gradient_accumulation_steps": 8,
            "learning_rate": 2e-4,
            "warmup_steps": 100,
            "logging_steps": 10,
            "save_steps": 500,
            "fp16": True
        }
    }
