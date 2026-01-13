import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { LearningService } from './learning.service.js';

const router = Router();
const learningService = new LearningService();

router.use(authenticate);

// AI 학습 데이터 저장 (피드백)
router.post('/feedback', async (req, res) => {
    try {
        const schema = z.object({
            imageUrl: z.string(),
            aiPrediction: z.any(),
            groundTruth: z.any(),
            isCorrect: z.boolean(),
            correctionType: z.enum(['accepted', 'modified', 'rejected']),
            toolId: z.number().optional(),
            feedback: z.string().optional()
        });

        const data = schema.parse(req.body);
        const userId = (req as any).userId;

        const result = await learningService.saveFeedback(userId, data);
        res.status(201).json({
            success: true,
            trainingData: result,
            message: 'AI 학습 데이터가 저장되었습니다'
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 필드별 보정 기록
router.post('/correction', async (req, res) => {
    try {
        const schema = z.object({
            trainingDataId: z.number(),
            originalField: z.string(),
            originalValue: z.string().optional(),
            correctedValue: z.string(),
            reason: z.string().optional()
        });

        const data = schema.parse(req.body);
        const userId = (req as any).userId;

        const result = await learningService.saveCorrection(userId, data);
        res.status(201).json({
            success: true,
            correction: result
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 학습 데이터 통계
router.get('/stats', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const stats = await learningService.getStats(userId);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 학습 데이터 목록
router.get('/data', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string || '50');
        const offset = parseInt(req.query.offset as string || '0');

        const result = await learningService.getLearningData(limit, offset);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 특정 학습 데이터 상세
router.get('/data/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await learningService.getLearningDataById(id);
        res.json(result);
    } catch (error: any) {
        const status = error.message === 'Not found' ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
});

// AI 모델 성능 분석
router.get('/analysis', async (req, res) => {
    try {
        const analysis = await learningService.getAnalysis();
        res.json(analysis);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
