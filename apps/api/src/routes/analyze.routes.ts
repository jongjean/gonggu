import { Router, Request, Response } from 'express';
import { AiService } from '../services/ai.service.js';

const router = Router();
const aiService = new AiService();

/**
 * POST /api/v1/analyze/image
 * 이미지 URL 분석
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
        const result = await aiService.analyzeImage(imageUrl);

        res.json(result);
    } catch (error: any) {
        console.error('❌ AI 분석 오류:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'AI 분석 실패'
        });
    }
});

/**
 * POST /api/v1/analyze/image-base64
 * Base64 이미지 분석
 */
router.post('/image-base64', async (req: Request, res: Response) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({
                success: false,
                error: 'imageBase64 is required'
            });
        }

        console.log(`🔍 AI Base64 분석 요청`);
        const result = await aiService.analyzeImageBase64(imageBase64);

        res.json(result);
    } catch (error: any) {
        console.error('❌ AI Base64 분석 오류:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'AI 분석 실패'
        });
    }
});

export default router;
