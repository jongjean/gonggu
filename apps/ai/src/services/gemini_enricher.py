"""
Gemini AI 보강 서비스
Quality Gate 실패 시 Gemini로 고품질 분석 수행
"""
import os
from typing import Dict, Optional
import google.generativeai as genai
from PIL import Image
import requests
from io import BytesIO

class GeminiEnricher:
    def __init__(self, api_key: Optional[str] = None):
        """
        Gemini 보강기 초기화
        
        Args:
            api_key: Gemini API 키
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다")
        
        genai.configure(api_key=self.api_key)
        # gemini-pro는 텍스트만 지원하므로 이미지는 URL로 설명
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        print("✅ Gemini 준비 완료")
    
    def download_image(self, image_url: str) -> Image.Image:
        """URL에서 이미지 다운로드"""
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content))
            return image.convert('RGB')
        except Exception as e:
            raise ValueError(f"이미지 다운로드 실패: {str(e)}")
    
    async def enrich(self, image_url: str, yolo_hint: Optional[str] = None) -> Dict:
        """
        Gemini로 이미지 분석 및 메타데이터 생성
        
        Args:
            image_url: 이미지 URL
            yolo_hint: YOLO가 탐지한 객체 힌트
            
        Returns:
            분석 결과 딕셔너리
        """
        try:
            # 이미지 다운로드
            image = self.download_image(image_url)
            
            # 프롬프트 생성
            prompt = self._build_prompt(yolo_hint)
            
            # Gemini 호출
            response = self.model.generate_content([prompt, image])
            result_text = response.text.strip()
            
            # JSON 파싱
            import json
            # ```json ... ``` 형식에서 JSON 추출
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].strip()
            
            result = json.loads(result_text)
            
            return {
                "success": True,
                **result,
                "provider": "gemini"
            }
            
        except Exception as e:
            print(f"⚠️ Gemini 오류: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "provider": "gemini"
            }
    
    def _build_prompt(self, yolo_hint: Optional[str]) -> str:
        """Gemini 프롬프트 생성"""
        base_prompt = """
이 이미지에 있는 공구를 분석하고 다음 JSON 형식으로 정보를 반환해주세요:

{
  "name": "공구의 전체 이름 (예: Bosch 무선 전동드릴 GSR 120-LI)",
  "brand": "제조사/브랜드 (예: Bosch, Makita, DeWalt 등, 불명확하면 null)",
  "category": "카테고리 (전동공구, 수공구, 측정공구, 절단공구 중 하나)",
  "description": "공구에 대한 간단한 설명 (20자 이내)",
  "color": "주요 색상 (예: 블루/블랙, 그린)",
  "tool_type": "공구 타입 (예: 드릴, 망치, 톱, 렌치 등)",
  "condition": "상태 추정 (상태 양호, 사용감 있음, 신품 등)",
  "rental_price": "예상 대여가 (일일, 원 단위 정수, 5000~30000 범위)"
}

JSON만 반환하고 다른 설명은 하지 마세요.
"""
        
        if yolo_hint:
            base_prompt += f"\n\n참고: 객체 탐지 결과는 '{yolo_hint}'입니다."
        
        return base_prompt
