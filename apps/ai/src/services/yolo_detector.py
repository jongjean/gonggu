"""
YOLO 객체 탐지 서비스
YOLOv8 Nano를 사용하여 공구 이미지에서 객체를 탐지합니다.
"""
import os
from typing import Dict, List, Optional
from ultralytics import YOLO
import torch
from PIL import Image
import requests
from io import BytesIO

class YOLODetector:
    def __init__(self, model_path: str = "yolov8n.pt", device: str = "cuda"):
        """
        YOLO 탐지기 초기화
        
        Args:
            model_path: YOLO 모델 경로
            device: 실행 장치 (cuda/cpu)
        """
        # GPU 사용 가능 여부 확인
        if device == "cuda" and torch.cuda.is_available():
            try:
                # GPU 호환성 테스트
                torch.zeros(1).cuda()
                self.device = "cuda"
                print(f"🔧 YOLO 초기화 중... (Device: cuda)")
            except Exception as e:
                print(f"⚠️ GPU 초기화 실패, CPU로 전환: {str(e)}")
                self.device = "cpu"
        else:
            self.device = "cpu"
            print(f"🔧 YOLO 초기화 중... (Device: cpu)")
        
        # 모델 로드
        self.model = YOLO(model_path)
        
        # GPU 메모리 최적화 (GTX 1060 3GB)
        if self.device == "cuda":
            torch.cuda.empty_cache()
            # FP16 사용 (half precision)
            self.model.to(self.device)
        
        print(f"✅ YOLO 준비 완료")
    
    def download_image(self, image_url: str) -> Image.Image:
        """URL에서 이미지 다운로드"""
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content))
            return image.convert('RGB')
        except Exception as e:
            raise ValueError(f"이미지 다운로드 실패: {str(e)}")
    
    async def detect(self, image_url: str) -> Dict:
        """
        이미지에서 객체 탐지
        
        Args:
            image_url: 이미지 URL
            
        Returns:
            탐지 결과 딕셔너리
        """
        try:
            # 이미지 다운로드
            image = self.download_image(image_url)
            
            # YOLO 추론 (FP16 사용)
            results = self.model.predict(
                image,
                conf=0.25,  # 신뢰도 임계값
                device=self.device,
                half=True if self.device == "cuda" else False,  # FP16
                verbose=False
            )
            
            # GPU 메모리 정리
            if self.device == "cuda":
                torch.cuda.empty_cache()
            
            # 결과 파싱
            detections = []
            if len(results) > 0 and len(results[0].boxes) > 0:
                for box in results[0].boxes:
                    detections.append({
                        "class_id": int(box.cls.item()),
                        "class_name": results[0].names[int(box.cls.item())],
                        "confidence": float(box.conf.item()),
                        "bbox": box.xyxy.tolist()[0]  # [x1, y1, x2, y2]
                    })
            
            # 주요 객체 선택 (가장 신뢰도 높은 것)
            primary_object = None
            if detections:
                primary_object = max(detections, key=lambda x: x["confidence"])
            
            return {
                "success": True,
                "detections": detections,
                "primary_object": primary_object,
                "count": len(detections)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "detections": [],
                "primary_object": None,
                "count": 0
            }
    
    def get_tool_category(self, class_name: str) -> str:
        """
        YOLO 클래스를 공구 카테고리로 매핑
        """
        # COCO 데이터셋 기반 매핑
        tool_mapping = {
            "scissors": "수공구",
            "knife": "절단공구",
            "bottle": "기타",
            "cup": "기타",
            # 실제로는 커스텀 YOLO 모델 필요
            # 현재는 일반 객체 탐지만 가능
        }
        
        return tool_mapping.get(class_name, "전동공구")
