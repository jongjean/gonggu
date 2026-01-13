"""
Quality Gate 서비스
AI 분석 결과의 품질을 점수화하여 검증
"""
from typing import Dict

class QualityGate:
    def __init__(self, threshold: float = 0.7):
        """
        Quality Gate 초기화
        
        Args:
            threshold: 통과 기준 점수 (0.0 ~ 1.0)
        """
        self.threshold = threshold
        print(f"✅ Quality Gate 준비 완료 (기준: {threshold})")
    
    def evaluate(self, result: Dict) -> Dict:
        """
        분석 결과의 품질 점수 계산
        
        Args:
            result: AI 분석 결과
            
        Returns:
            평가 결과 {"score": float, "passed": bool, "details": dict}
        """
        score = 0.0
        details = {}
        
        # 1. 이름 (30%)
        if result.get("name") and len(result["name"]) > 3:
            score += 0.3
            details["name"] = "✅"
        else:
            details["name"] = "❌"
        
        # 2. 브랜드 (20%)
        if result.get("brand"):
            score += 0.2
            details["brand"] = "✅"
        else:
            details["brand"] = "❌"
        
        # 3. 카테고리 (20%)
        if result.get("category"):
            score += 0.2
            details["category"] = "✅"
        else:
            details["category"] = "❌"
        
        # 4. 설명 (15%)
        if result.get("description") and len(result["description"]) > 5:
            score += 0.15
            details["description"] = "✅"
        else:
            details["description"] = "❌"
        
        # 5. 신뢰도 (15%)
        confidence = result.get("confidence", 0)
        if confidence >= 0.8:
            score += 0.15
            details["confidence"] = f"✅ {confidence:.2f}"
        elif confidence >= 0.6:
            score += 0.1
            details["confidence"] = f"⚠️ {confidence:.2f}"
        else:
            details["confidence"] = f"❌ {confidence:.2f}"
        
        passed = score >= self.threshold
        
        return {
            "score": round(score, 2),
            "passed": passed,
            "threshold": self.threshold,
            "details": details,
            "verdict": "PASS ✅" if passed else "FAIL → Gemini 폴백 🔄"
        }
