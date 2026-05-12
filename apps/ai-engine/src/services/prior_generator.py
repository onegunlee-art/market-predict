import numpy as np
from typing import Dict, Any, Optional, List
from src.config import settings


class PriorGenerator:
    """
    Generates AI prior probabilities for prediction markets.

    This is a simplified implementation. In production, this would use:
    - Trained LightGBM/XGBoost models
    - Historical data analysis
    - External API integrations (TMDB, Spotify, etc.)
    - Real-time sentiment analysis
    """

    def __init__(self):
        self.category_baselines = {
            "KPOP": 0.5,
            "MOVIE": 0.45,
            "DRAMA": 0.4,
            "TV_SHOW": 0.4,
            "BEAUTY": 0.5,
            "CONSUMER": 0.5,
            "VIRAL": 0.35,
            "OTHER": 0.5,
        }

        self.feature_names = [
            "historical_accuracy",
            "sentiment_score",
            "trend_momentum",
            "market_volume",
            "time_to_resolution",
            "category_baseline",
            "content_popularity",
            "social_engagement",
        ]

    async def generate(
        self,
        market_id: str,
        content_id: Optional[str],
        category: str,
        question: str,
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate a prior probability for the market."""

        features = await self._extract_features(
            category=category,
            question=question,
            content_id=content_id,
            metadata=metadata,
        )

        probability = self._calculate_probability(features)

        confidence = self._calculate_confidence(features)

        explanation = self._generate_explanation(category, features, probability)

        return {
            "probability": probability,
            "confidence": confidence,
            "features": features,
            "explanation": explanation,
        }

    async def _extract_features(
        self,
        category: str,
        question: str,
        content_id: Optional[str],
        metadata: Dict[str, Any],
    ) -> Dict[str, float]:
        """Extract features for probability calculation."""

        features = {
            "category_baseline": self.category_baselines.get(category, 0.5),
            "historical_accuracy": 0.7 + np.random.uniform(-0.1, 0.1),
            "sentiment_score": 0.5 + np.random.uniform(-0.3, 0.3),
            "trend_momentum": np.random.uniform(0.3, 0.7),
            "market_volume": np.random.uniform(0.2, 0.8),
            "time_to_resolution": np.random.uniform(0.4, 0.8),
            "content_popularity": np.random.uniform(0.3, 0.7),
            "social_engagement": np.random.uniform(0.2, 0.8),
        }

        if metadata:
            if "popularity" in metadata:
                features["content_popularity"] = min(metadata["popularity"] / 100, 1.0)

            if "followers" in metadata:
                features["social_engagement"] = min(
                    np.log10(metadata["followers"] + 1) / 8, 1.0
                )

        return features

    def _calculate_probability(self, features: Dict[str, float]) -> float:
        """Calculate probability from features."""

        weights = {
            "category_baseline": 0.2,
            "historical_accuracy": 0.15,
            "sentiment_score": 0.2,
            "trend_momentum": 0.15,
            "content_popularity": 0.15,
            "social_engagement": 0.15,
        }

        probability = sum(
            features.get(key, 0.5) * weight for key, weight in weights.items()
        )

        probability = max(0.05, min(0.95, probability))

        return round(probability, 4)

    def _calculate_confidence(self, features: Dict[str, float]) -> float:
        """Calculate confidence in the probability estimate."""

        feature_values = list(features.values())
        variance = np.var(feature_values)

        base_confidence = settings.default_confidence

        confidence = base_confidence - (variance * 0.5)

        return round(max(0.3, min(0.95, confidence)), 4)

    def _generate_explanation(
        self, category: str, features: Dict[str, float], probability: float
    ) -> str:
        """Generate a human-readable explanation."""

        explanations = []

        if features["sentiment_score"] > 0.6:
            explanations.append("긍정적인 소셜 미디어 반응")
        elif features["sentiment_score"] < 0.4:
            explanations.append("부정적인 소셜 미디어 반응")

        if features["trend_momentum"] > 0.6:
            explanations.append("상승 트렌드")
        elif features["trend_momentum"] < 0.4:
            explanations.append("하락 트렌드")

        if features["content_popularity"] > 0.7:
            explanations.append("높은 콘텐츠 인기도")

        category_names = {
            "KPOP": "K-POP",
            "MOVIE": "영화",
            "DRAMA": "드라마",
            "TV_SHOW": "TV 프로그램",
            "BEAUTY": "뷰티",
            "CONSUMER": "소비재",
            "VIRAL": "바이럴",
        }

        category_name = category_names.get(category, category)
        prob_percent = int(probability * 100)

        if explanations:
            factors = ", ".join(explanations)
            return f"{category_name} 카테고리 분석 결과, {factors}을(를) 고려하여 {prob_percent}% 확률로 예측됩니다."
        else:
            return f"{category_name} 카테고리의 기본 패턴 분석을 기반으로 {prob_percent}% 확률로 예측됩니다."

    def get_feature_names(self) -> List[str]:
        """Return the list of feature names used by the model."""
        return self.feature_names
