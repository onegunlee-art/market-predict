from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

from src.services.prior_generator import PriorGenerator
from src.config import settings

router = APIRouter()
prior_generator = PriorGenerator()


class GeneratePriorRequest(BaseModel):
    market_id: str
    content_id: Optional[str] = None
    category: str
    question: str
    metadata: Optional[Dict[str, Any]] = None


class GeneratePriorResponse(BaseModel):
    probability: float
    confidence: float
    features: Dict[str, Any]
    explanation: str
    model_version: str
    generated_at: datetime


@router.post("/generate", response_model=GeneratePriorResponse)
async def generate_prior(request: GeneratePriorRequest):
    """Generate an AI prior probability for a market."""
    try:
        result = await prior_generator.generate(
            market_id=request.market_id,
            content_id=request.content_id,
            category=request.category,
            question=request.question,
            metadata=request.metadata or {},
        )

        return GeneratePriorResponse(
            probability=result["probability"],
            confidence=result["confidence"],
            features=result["features"],
            explanation=result["explanation"],
            model_version=settings.model_version,
            generated_at=datetime.utcnow(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-generate")
async def batch_generate_priors(requests: list[GeneratePriorRequest]):
    """Generate AI priors for multiple markets."""
    results = []

    for req in requests:
        try:
            result = await prior_generator.generate(
                market_id=req.market_id,
                content_id=req.content_id,
                category=req.category,
                question=req.question,
                metadata=req.metadata or {},
            )
            results.append(
                {
                    "market_id": req.market_id,
                    "success": True,
                    "data": result,
                }
            )
        except Exception as e:
            results.append(
                {
                    "market_id": req.market_id,
                    "success": False,
                    "error": str(e),
                }
            )

    return {"results": results}


@router.get("/model-info")
async def get_model_info():
    """Get information about the current AI model."""
    return {
        "model_version": settings.model_version,
        "features": prior_generator.get_feature_names(),
        "categories_supported": [
            "KPOP",
            "MOVIE",
            "DRAMA",
            "TV_SHOW",
            "BEAUTY",
            "CONSUMER",
            "VIRAL",
        ],
        "last_updated": "2026-01-01T00:00:00Z",
    }
