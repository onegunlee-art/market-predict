from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from src.services.sentiment_analyzer import SentimentAnalyzer

router = APIRouter()
sentiment_analyzer = SentimentAnalyzer()


class AnalyzeSentimentRequest(BaseModel):
    content_id: Optional[str] = None
    market_id: Optional[str] = None
    text: Optional[str] = None
    keywords: Optional[List[str]] = None


class SentimentSource(BaseModel):
    platform: str
    score: float
    sample_size: int


class AnalyzeSentimentResponse(BaseModel):
    score: float
    magnitude: float
    sources: List[SentimentSource]
    analyzed_at: datetime


@router.post("/analyze", response_model=AnalyzeSentimentResponse)
async def analyze_sentiment(request: AnalyzeSentimentRequest):
    """Analyze sentiment for content or market."""
    try:
        result = await sentiment_analyzer.analyze(
            content_id=request.content_id,
            market_id=request.market_id,
            text=request.text,
            keywords=request.keywords or [],
        )

        return AnalyzeSentimentResponse(
            score=result["score"],
            magnitude=result["magnitude"],
            sources=[
                SentimentSource(
                    platform=s["platform"],
                    score=s["score"],
                    sample_size=s["sample_size"],
                )
                for s in result["sources"]
            ],
            analyzed_at=datetime.utcnow(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends/{category}")
async def get_category_trends(category: str):
    """Get sentiment trends for a category."""
    trends = await sentiment_analyzer.get_trends(category)
    return {"category": category, "trends": trends}
