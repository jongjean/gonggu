"""
AI Provider Router
YOLO → HuggingFace → Quality Gate → Gemini 폴백 파이프라인
"""
import os
from typing import Dict
from .yolo_detector import YOLODetector
from .gemini_enricher import GeminiEnricher
from .quality_gate import QualityGate
import time

class AIProviderRouter:
    def __init__(self):
        """AI Provider Router 초기화"""
        print("🚀 AI Provider Router 초기화 중...")
        
        # 환경 변수
        device = os.getenv("DEVICE", "cuda")
        model_path = os.getenv("YOLO_MODEL", "yolov8n.pt")
        quality_threshold = float(os.getenv("QUALITY_THRESHOLD", "0.7"))
        
        # 서비스 초기화
        self.yolo = YOLODetector(model_path=model_path, device=device)
        self.gemini = GeminiEnricher()
        self.quality_gate = QualityGate(threshold=quality_threshold)
        
        print("✅ AI Provider Router 준비 완료!\n")
    
    async def analyze(self, image_url: str) -> Dict:
        """
        이미지 분석 파이프라인
        
        Args:
            image_url: 분석할 이미지 URL
            
        Returns:
            분석 결과
        """
        start_time = time.time()
        print(f"\n{'='*60}")
        print(f"🔍 AI 분석 시작: {image_url}")
        print(f"{'='*60}\n")
        
        try:
            # Step 1: YOLO 객체 탐지 (항상 실행)
            print("1️⃣ YOLO 객체 탐지 실행 중...")
            yolo_result = await self.yolo.detect(image_url)
            
            if not yolo_result["success"]:
                return {
                    "success": False,
                    "error": f"YOLO 탐지 실패: {yolo_result.get('error')}",
                    "provider": "yolo"
                }
            
            print(f"   ✅ YOLO 완료: {yolo_result['count']}개 객체 탐지")
            if yolo_result["primary_object"]:
                print(f"   🎯 주요 객체: {yolo_result['primary_object']['class_name']} "
                      f"(신뢰도: {yolo_result['primary_object']['confidence']:.2f})")
            
            # Step 2: 기본 결과 생성 (YOLO 기반)
            primary_obj = yolo_result.get("primary_object")
            if not primary_obj:
                # 객체 탐지 실패 시 즉시 Gemini로
                print("\n⚠️ 객체 미탐지 → Gemini 직접 호출")
                return await self._gemini_fallback(image_url, None)
            
            # YOLO 결과로 초기 데이터 생성
            initial_result = {
                "name": f"{primary_obj['class_name']}",
                "brand": None,
                "category": self.yolo.get_tool_category(primary_obj['class_name']),
                "description": f"{primary_obj['class_name']} 공구",
                "confidence": primary_obj["confidence"],
                "tool_type": primary_obj['class_name'],
                "yolo_class": primary_obj['class_name']
            }
            
            # Step 3: Quality Gate 평가
            print("\n2️⃣ Quality Gate 평가 중...")
            evaluation = self.quality_gate.evaluate(initial_result)
            
            print(f"   📊 품질 점수: {evaluation['score']:.2f} / {evaluation['threshold']}")
            print(f"   📋 세부 평가: {evaluation['details']}")
            print(f"   {evaluation['verdict']}")
            
            # Step 4: Quality Gate 통과 여부 확인
            if evaluation["passed"]:
                # 통과 → YOLO 결과 반환
                processing_time = time.time() - start_time
                print(f"\n✅ Quality Gate 통과! YOLO 결과 반환")
                print(f"⏱️  처리 시간: {processing_time:.2f}초")
                print(f"{'='*60}\n")
                
                return {
                    "success": True,
                    **initial_result,
                    "provider": "yolo",
                    "quality_score": evaluation["score"],
                    "processing_time_ms": int(processing_time * 1000)
                }
            else:
                # 실패 → Gemini 폴백
                print(f"\n🔄 Quality Gate 실패 → Gemini 폴백 실행")
                return await self._gemini_fallback(
                    image_url,
                    primary_obj['class_name']
                )
        
        except Exception as e:
            print(f"\n❌ 분석 오류: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "provider": "error"
            }
    
    async def _gemini_fallback(self, image_url: str, yolo_hint: str = None) -> Dict:
        """Gemini 폴백 실행"""
        start_time = time.time()
        
        print("\n3️⃣ Gemini 고품질 분석 실행 중...")
        gemini_result = await self.gemini.enrich(image_url, yolo_hint)
        
        if not gemini_result["success"]:
            return {
                "success": False,
                "error": f"Gemini 분석 실패: {gemini_result.get('error')}",
                "provider": "gemini"
            }
        
        processing_time = time.time() - start_time
        print(f"   ✅ Gemini 완료!")
        print(f"   🎯 결과: {gemini_result.get('name', 'N/A')}")
        print(f"   🏢 브랜드: {gemini_result.get('brand', 'N/A')}")
        print(f"⏱️  총 처리 시간: {processing_time:.2f}초")
        print(f"{'='*60}\n")
        
        return {
            "success": True,
            **gemini_result,
            "processing_time_ms": int(processing_time * 1000)
        }
