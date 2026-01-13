import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// AI 서버 URL (환경 변수 또는 기본값)
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

/**
 * POST /api/v1/analyze/image
 * 이미지 URL을 받아서 AI 서버로 전달하고 분석 결과 반환
 */
router.post('/image', async (req: Request, res: Response) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                error: 'imageUrl is required'
            });
        }

        console.log(`🔍 AI 분석 요청: ${imageUrl}`);

        // AI 서버로 프록시
        const aiResponse = await fetch(`${AI_SERVER_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image_url: imageUrl }),
        });

        const aiResult = await aiResponse.json();

        console.log(`✅ AI 분석 완료 (provider: ${aiResult.candidates?.[0]?.provider || 'unknown'})`);

        res.json(aiResult);
    } catch (error: any) {
        console.error('❌ AI 분석 오류:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'AI 서버 연결 실패'
        });
    }
});

export default router;
