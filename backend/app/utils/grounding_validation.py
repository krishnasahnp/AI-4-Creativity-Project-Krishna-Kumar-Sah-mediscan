"""
Grounding validation for AI assistant responses.
Ensures AI responses are grounded in actual findings and data.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class GroundingStatus(str, Enum):
    """Status of grounding check"""
    GROUNDED = "grounded"
    PARTIALLY_GROUNDED = "partially_grounded"
    UNGROUNDED = "ungrounded"
    UNCERTAIN = "uncertain"


@dataclass
class GroundingResult:
    """Result of grounding validation"""
    status: GroundingStatus
    confidence: float
    grounded_claims: List[Dict[str, Any]]
    ungrounded_claims: List[Dict[str, Any]]
    citations: List[Dict[str, Any]]
    warnings: List[str]
    
    def to_dict(self) -> dict:
        return {
            "status": self.status.value,
            "confidence": self.confidence,
            "grounded_claims": self.grounded_claims,
            "ungrounded_claims": self.ungrounded_claims,
            "citations": self.citations,
            "warnings": self.warnings
        }


class GroundingValidator:
    """
    Validates AI responses against source data to prevent hallucination.
    """
    
    # Medical finding patterns
    FINDING_PATTERNS = [
        r'(?:lesion|mass|nodule|opacity|consolidation)',
        r'(?:hemorrhage|bleeding|hematoma)',
        r'(?:fracture|break|crack)',
        r'(?:tumor|carcinoma|malignancy)',
        r'(?:pneumonia|infection|inflammation)',
        r'(?:effusion|fluid collection)',
        r'(?:stenosis|narrowing|obstruction)',
    ]
    
    # Measurement patterns
    MEASUREMENT_PATTERNS = [
        r'(\d+(?:\.\d+)?)\s*(?:mm|cm|ml|cc)',
        r'(\d+(?:\.\d+)?)\s*(?:millimeter|centimeter)',
        r'(\d+(?:\.\d+)?)\s*%',
    ]
    
    # Certainty indicators
    CERTAINTY_PHRASES = {
        'high': ['definitely', 'certainly', 'clearly', 'obviously', 'confirmed'],
        'medium': ['likely', 'probably', 'suggests', 'indicates', 'appears'],
        'low': ['possibly', 'may', 'might', 'uncertain', 'unclear'],
    }
    
    HALLUCINATION_INDICATORS = [
        'I believe', 'I think', 'in my opinion',
        'typically', 'usually', 'generally',
        'studies show', 'research indicates',
    ]
    
    def __init__(self):
        self.finding_regex = re.compile(
            '|'.join(self.FINDING_PATTERNS), 
            re.IGNORECASE
        )
    
    def validate_response(
        self,
        response: str,
        source_findings: List[Dict[str, Any]],
        source_measurements: Optional[Dict[str, Any]] = None,
        source_report: Optional[str] = None,
        strict_mode: bool = False
    ) -> GroundingResult:
        """
        Validate an AI response against source data.
        
        Args:
            response: The AI-generated response text
            source_findings: List of actual findings from AI analysis
            source_measurements: Dict of actual measurements
            source_report: Original report text if available
            strict_mode: If True, require exact matches
        
        Returns:
            GroundingResult with validation details
        """
        warnings = []
        grounded_claims = []
        ungrounded_claims = []
        citations = []
        
        # Extract claims from response
        claims = self._extract_claims(response)
        
        # Check each claim against source data
        for claim in claims:
            is_grounded, source = self._check_claim_grounding(
                claim,
                source_findings,
                source_measurements,
                source_report,
                strict_mode
            )
            
            if is_grounded:
                grounded_claims.append({
                    "claim": claim,
                    "source": source,
                    "confidence": 0.9 if source else 0.7
                })
                if source:
                    citations.append(source)
            else:
                ungrounded_claims.append({
                    "claim": claim,
                    "reason": "No matching source data found"
                })
        
        # Check for hallucination indicators
        for indicator in self.HALLUCINATION_INDICATORS:
            if indicator.lower() in response.lower():
                warnings.append(f"Response contains general statement: '{indicator}'")
        
        # Calculate overall grounding score
        total_claims = len(grounded_claims) + len(ungrounded_claims)
        if total_claims == 0:
            confidence = 1.0
            status = GroundingStatus.GROUNDED
        else:
            grounding_ratio = len(grounded_claims) / total_claims
            confidence = grounding_ratio
            
            if grounding_ratio >= 0.9:
                status = GroundingStatus.GROUNDED
            elif grounding_ratio >= 0.6:
                status = GroundingStatus.PARTIALLY_GROUNDED
            elif grounding_ratio >= 0.3:
                status = GroundingStatus.UNCERTAIN
            else:
                status = GroundingStatus.UNGROUNDED
                warnings.append("Response may contain unverified information")
        
        return GroundingResult(
            status=status,
            confidence=confidence,
            grounded_claims=grounded_claims,
            ungrounded_claims=ungrounded_claims,
            citations=citations,
            warnings=warnings
        )
    
    def _extract_claims(self, response: str) -> List[str]:
        """Extract factual claims from response text"""
        claims = []
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', response)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Check if sentence contains medical findings
            if self.finding_regex.search(sentence):
                claims.append(sentence)
            
            # Check if sentence contains measurements
            for pattern in self.MEASUREMENT_PATTERNS:
                if re.search(pattern, sentence):
                    claims.append(sentence)
                    break
        
        return claims
    
    def _check_claim_grounding(
        self,
        claim: str,
        findings: List[Dict[str, Any]],
        measurements: Optional[Dict[str, Any]],
        report: Optional[str],
        strict_mode: bool
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Check if a claim is grounded in source data"""
        claim_lower = claim.lower()
        
        # Check against findings
        for finding in findings:
            finding_label = finding.get('label', '').lower()
            finding_desc = finding.get('description', '').lower()
            
            if strict_mode:
                # Require exact match
                if finding_label in claim_lower or finding_desc in claim_lower:
                    return True, {"type": "finding", "data": finding}
            else:
                # Fuzzy match - check for key terms
                finding_terms = set(finding_label.split() + finding_desc.split())
                claim_terms = set(claim_lower.split())
                overlap = finding_terms & claim_terms
                
                if len(overlap) >= 2:  # At least 2 matching terms
                    return True, {"type": "finding", "data": finding}
        
        # Check against measurements
        if measurements:
            for key, value in measurements.items():
                if isinstance(value, dict):
                    val = value.get('value', '')
                    if str(val) in claim:
                        return True, {"type": "measurement", "key": key, "value": value}
                elif str(value) in claim:
                    return True, {"type": "measurement", "key": key, "value": value}
        
        # Check against original report
        if report:
            report_lower = report.lower()
            # Extract key phrases from claim
            claim_words = claim_lower.split()
            matching_words = sum(1 for word in claim_words if word in report_lower)
            
            if matching_words / len(claim_words) > 0.5:
                return True, {"type": "report", "excerpt": claim}
        
        return False, None
    
    def add_citations(
        self,
        response: str,
        grounding_result: GroundingResult
    ) -> str:
        """Add citation markers to response text"""
        modified_response = response
        citation_map = {}
        
        for i, claim in enumerate(grounding_result.grounded_claims):
            claim_text = claim['claim']
            source = claim.get('source')
            
            if source and claim_text in modified_response:
                citation_num = len(citation_map) + 1
                citation_marker = f" [{citation_num}]"
                modified_response = modified_response.replace(
                    claim_text,
                    claim_text + citation_marker,
                    1
                )
                citation_map[citation_num] = source
        
        # Add citation footnotes
        if citation_map:
            modified_response += "\n\n---\nSources:\n"
            for num, source in citation_map.items():
                source_type = source.get('type', 'unknown')
                if source_type == 'finding':
                    data = source.get('data', {})
                    modified_response += f"[{num}] AI Finding: {data.get('label', 'Unknown')}\n"
                elif source_type == 'measurement':
                    modified_response += f"[{num}] Measurement: {source.get('key')}\n"
                elif source_type == 'report':
                    modified_response += f"[{num}] Original Report\n"
        
        return modified_response
    
    def generate_disclaimer(self, grounding_result: GroundingResult) -> str:
        """Generate appropriate disclaimer based on grounding result"""
        if grounding_result.status == GroundingStatus.GROUNDED:
            return (
                "This response is based on the analyzed imaging data and AI findings. "
                "All claims are supported by source data."
            )
        elif grounding_result.status == GroundingStatus.PARTIALLY_GROUNDED:
            return (
                "This response contains some information that may not be directly "
                "supported by the analyzed data. Please verify key findings with "
                "the original imaging study."
            )
        elif grounding_result.status == GroundingStatus.UNCERTAIN:
            return (
                "⚠️ CAUTION: Significant portions of this response could not be "
                "verified against the source data. Professional review is strongly "
                "recommended before clinical use."
            )
        else:
            return (
                "⚠️ WARNING: This response contains substantial unverified information. "
                "Do not use for clinical decision-making without thorough verification "
                "by a qualified medical professional."
            )


# Create singleton instance
grounding_validator = GroundingValidator()


def validate_assistant_response(
    response: str,
    findings: List[Dict[str, Any]],
    measurements: Optional[Dict[str, Any]] = None,
    report: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function to validate and enhance an assistant response.
    
    Returns dict with:
    - validated_response: Response with citations
    - grounding_result: Validation details
    - disclaimer: Appropriate disclaimer text
    """
    result = grounding_validator.validate_response(
        response=response,
        source_findings=findings,
        source_measurements=measurements,
        source_report=report
    )
    
    cited_response = grounding_validator.add_citations(response, result)
    disclaimer = grounding_validator.generate_disclaimer(result)
    
    return {
        "validated_response": cited_response,
        "grounding_result": result.to_dict(),
        "disclaimer": disclaimer,
        "is_safe": result.status in [GroundingStatus.GROUNDED, GroundingStatus.PARTIALLY_GROUNDED]
    }
