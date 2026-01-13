from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 프로젝트 루트를 sys.path에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from services.ai_router import AIProviderRouter

app = FastAPI(title="Gonggu AI Service", version="1.0.0")

# AI Router 초기화 (서버 시작 시 한 번만)
ai_router = None

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 AI Router 초기화"""
    global ai_router
    print("\n🚀 Gonggu AI Service 시작 중...\n")
    ai_router = AIProviderRouter()
    print("✅ 서버 준비 완료!\n")

class AnalyzeRequest(BaseModel):
    image_url: str

class ToolCandidate(BaseModel):
    name: str
    brand: Optional[str] = None
    category: str
    description: Optional[str] = None
    tool_type: Optional[str] = None
    color: Optional[str] = None
    condition: Optional[str] = "상태 양호"
    rental_price: Optional[int] = 15000
    confidence: float
    provider: str

class AnalyzeResponse(BaseModel):
    success: bool
    candidates: List[ToolCandidate]
    processing_time_ms: int
    error: Optional[str] = None

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(request: AnalyzeRequest):
    """
    이미지 분석 API
    
    YOLO → HuggingFace → Quality Gate → Gemini 폴백 파이프라인
    """
    if not ai_router:
        raise HTTPException(status_code=503, detail="AI 서비스가 초기화되지 않았습니다")
    
    try:
        # AI 분석 실행
        result = await ai_router.analyze(request.image_url)
        
        if not result["success"]:
            return AnalyzeResponse(
                success=False,
                candidates=[],
                processing_time_ms=0,
                error=result.get("error", "분석 실패")
            )
        
        # 결과를 candidates 형식으로 변환
        candidate = ToolCandidate(
            name=result.get("name", "공구"),
            brand=result.get("brand"),
            category=result.get("category", "전동공구"),
            description=result.get("description"),
            tool_type=result.get("tool_type"),
            color=result.get("color"),
            condition=result.get("condition", "상태 양호"),
            rental_price=result.get("rental_price", 15000),
            confidence=result.get("confidence", 0.8),
            provider=result.get("provider", "unknown")
        )
        
        return AnalyzeResponse(
            success=True,
            candidates=[candidate],
            processing_time_ms=result.get("processing_time_ms", 0)
        )
        
    except Exception as e:
        print(f"❌ API 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/healthz")
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "device": os.getenv("DEVICE", "cpu"),
        "ai_router_ready": ai_router is not None
    }

@app.get("/")
def root():
    return {
        "message": "🤖 Gonggu AI Service v1.0 - 완전 버전",
        "features": [
            "YOLO 객체 탐지",
            "Quality Gate 검증",
            "Gemini 고품질 폴백"
        ],
        "endpoints": {
            "analyze": "/analyze",
            "health": "/healthz"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
