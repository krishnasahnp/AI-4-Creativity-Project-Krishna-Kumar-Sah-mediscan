"""
MediVision AI - AI Assistant API Endpoints

Handles multimodal chat with image + text + voice.

Author: MediVision AI Team
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, TokenPayload
from app.db import get_db, Study

router = APIRouter()


# ============================================================================
# Request/Response Schemas
# ============================================================================

class ChatMessage(BaseModel):
    """A single chat message."""
    role: str = Field(..., description="user, assistant, or system")
    content: str
    timestamp: datetime
    image_context: Optional[str] = None  # Study ID if image-related


class ChatRequest(BaseModel):
    """Chat request with optional image context."""
    message: str
    study_id: Optional[UUID] = None
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    mode: str = Field(default="general", description="general, explanation, comparison")


class ChatResponse(BaseModel):
    """Chat response from AI assistant."""
    message: str
    suggestions: List[str] = Field(default_factory=list)
    references: Optional[dict] = None
    highlighted_regions: Optional[List[dict]] = None
    voice_enabled: bool = False


class VoiceInputRequest(BaseModel):
    """Voice input request."""
    study_id: Optional[UUID] = None
    conversation_history: List[ChatMessage] = Field(default_factory=list)


class VoiceInputResponse(BaseModel):
    """Voice input response after transcription and processing."""
    transcribed_text: str
    assistant_response: str
    audio_url: Optional[str] = None  # URL to synthesized speech response


class SimilarCaseRequest(BaseModel):
    """Request to find similar cases."""
    study_id: UUID
    top_k: int = Field(default=5, ge=1, le=20)
    include_reports: bool = True


class SimilarCaseResult(BaseModel):
    """A similar case result."""
    study_id: str
    similarity_score: float
    modality: str
    body_part: Optional[str]
    findings_summary: Optional[str]


class SimilarCaseResponse(BaseModel):
    """Response with similar cases."""
    query_study_id: str
    similar_cases: List[SimilarCaseResult]
    retrieval_method: str


# ============================================================================
# Endpoints
# ============================================================================

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with AI assistant",
    description="Send a message to the multimodal AI assistant."
)
async def chat(
    request: ChatRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ChatResponse:
    """
    Chat with the multimodal AI assistant.
    
    The assistant can:
    - Answer questions about imaging studies
    - Explain AI predictions and findings
    - Highlight regions of interest
    - Compare with similar cases
    
    Modes:
    - **general**: General radiology questions
    - **explanation**: Explain AI predictions for a study
    - **comparison**: Compare current study with similar cases
    """
    # Validate study if provided
    study = None
    if request.study_id:
        result = await db.execute(
            select(Study).where(Study.id == request.study_id)
        )
        study = result.scalar_one_or_none()
        
        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study not found"
            )
    
    # In production, this would call the multimodal LLM
    # For now, return contextual mock responses
    
    message = request.message.lower()
    
    # Generate contextual response
    if "lesion" in message or "abnormal" in message:
        response = ChatResponse(
            message="Based on the AI analysis, there appears to be a suspicious region in the right lower lobe. "
                   "The classification model indicates this with 0.87 confidence. "
                   "Would you like me to highlight the specific area or compare with similar cases?",
            suggestions=[
                "Show me the highlighted region",
                "What are the measurements?",
                "Find similar cases",
                "Generate a report"
            ],
            highlighted_regions=[
                {"x": 120, "y": 80, "width": 50, "height": 40, "label": "Suspicious region"}
            ]
        )
    elif "explain" in message or "why" in message:
        response = ChatResponse(
            message="The AI model focused primarily on the texture and density patterns in the highlighted region. "
                   "The attention map shows high activation in areas with irregular boundaries and ground-glass opacity. "
                   "These features are commonly associated with the predicted findings.",
            suggestions=[
                "Show attention heatmap",
                "What would change the prediction?",
                "Show confidence calibration"
            ],
            references={
                "attention_map": f"/api/v1/studies/{request.study_id}/attention" if study else None,
                "grad_cam": f"/api/v1/studies/{request.study_id}/gradcam" if study else None
            }
        )
    elif "similar" in message or "compare" in message:
        response = ChatResponse(
            message="I found 5 similar cases in the database. The most similar case (92% match) "
                   "had similar findings in the same anatomical region. "
                   "Would you like to see a side-by-side comparison?",
            suggestions=[
                "Show side-by-side comparison",
                "View similar case reports",
                "What are the differences?"
            ]
        )
    else:
        response = ChatResponse(
            message="I'm your MediVision AI assistant. I can help you understand imaging studies, "
                   "explain AI predictions, and find similar cases. "
                   f"How can I assist you{' with this ' + study.modality.value + ' study' if study else ''}?",
            suggestions=[
                "What does this study show?",
                "Explain the AI findings",
                "Find similar cases",
                "Generate a report"
            ]
        )
    
    return response


@router.post(
    "/voice",
    response_model=VoiceInputResponse,
    summary="Process voice input",
    description="Transcribe voice input and get AI response."
)
async def process_voice(
    audio: UploadFile = File(..., description="Audio file"),
    study_id: Optional[UUID] = Form(None),
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> VoiceInputResponse:
    """
    Process voice input from the user.
    
    The audio is transcribed and processed by the AI assistant.
    Optionally returns a synthesized voice response.
    """
    # In production, this would:
    # 1. Save the audio file
    # 2. Transcribe using Whisper
    # 3. Process through the chat endpoint
    # 4. Optionally synthesize response audio
    
    # Mock transcription for demo
    transcribed = "What are the key findings in this study?"
    
    # Generate response
    assistant_response = (
        "The AI analysis identified several key findings: "
        "First, there appears to be a small opacity in the right lower lobe measuring approximately 12mm. "
        "The confidence score for this finding is 0.89. "
        "Additionally, the lung parenchyma shows normal aeration in other regions."
    )
    
    return VoiceInputResponse(
        transcribed_text=transcribed,
        assistant_response=assistant_response,
        audio_url=None  # Would contain URL to synthesized audio
    )


@router.post(
    "/similar-cases",
    response_model=SimilarCaseResponse,
    summary="Find similar cases",
    description="Find cases similar to a given study using multimodal retrieval."
)
async def find_similar_cases(
    request: SimilarCaseRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SimilarCaseResponse:
    """
    Find similar cases using multimodal retrieval.
    
    Uses the multimodal transformer to find studies with similar:
    - Image features
    - Report content
    - Findings patterns
    """
    # Verify study exists
    result = await db.execute(
        select(Study).where(Study.id == request.study_id)
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # In production, this would query the multimodal retrieval index
    # For now, return mock similar cases
    
    similar_cases = [
        SimilarCaseResult(
            study_id="mock-study-1",
            similarity_score=0.92,
            modality=study.modality.value,
            body_part=study.body_part,
            findings_summary="Similar pattern in right lower lobe with ground-glass opacity"
        ),
        SimilarCaseResult(
            study_id="mock-study-2",
            similarity_score=0.87,
            modality=study.modality.value,
            body_part=study.body_part,
            findings_summary="Comparable density patterns with mild consolidation"
        ),
        SimilarCaseResult(
            study_id="mock-study-3",
            similarity_score=0.84,
            modality=study.modality.value,
            body_part=study.body_part,
            findings_summary="Related anatomical features with subtle nodular pattern"
        ),
    ]
    
    return SimilarCaseResponse(
        query_study_id=str(request.study_id),
        similar_cases=similar_cases[:request.top_k],
        retrieval_method="multimodal_transformer_contrastive"
    )


@router.post(
    "/explain",
    summary="Explain AI prediction",
    description="Get a detailed explanation of AI predictions for a study."
)
async def explain_prediction(
    study_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Generate detailed explanation of AI predictions.
    
    Includes:
    - Feature importance
    - Attention visualization
    - Counterfactual analysis
    - Confidence breakdown
    """
    # Verify study exists
    result = await db.execute(
        select(Study).where(Study.id == study_id)
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    return {
        "study_id": str(study_id),
        "explanation": {
            "summary": "The model's prediction was primarily influenced by texture features and density patterns.",
            "key_features": [
                {"feature": "Texture irregularity", "importance": 0.35},
                {"feature": "Density pattern", "importance": 0.28},
                {"feature": "Shape characteristics", "importance": 0.22},
                {"feature": "Location context", "importance": 0.15}
            ],
            "attention_regions": [
                {"region": "Right lower lobe", "attention_score": 0.67},
                {"region": "Right upper lobe", "attention_score": 0.18}
            ],
            "counterfactual": {
                "description": "If the suspected region were removed, prediction probability drops by 0.43",
                "original_prob": 0.87,
                "counterfactual_prob": 0.44
            },
            "confidence_calibration": {
                "model_confidence": 0.87,
                "calibrated_confidence": 0.82,
                "reliability_score": 0.91
            }
        },
        "visualizations": {
            "attention_map": f"/api/v1/studies/{study_id}/visualizations/attention",
            "grad_cam": f"/api/v1/studies/{study_id}/visualizations/gradcam",
            "counterfactual": f"/api/v1/studies/{study_id}/visualizations/counterfactual"
        }
    }
