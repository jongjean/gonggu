import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { StatsService } from './stats.service.js';

const router = Router();
const statsService = new StatsService();

router.use(authenticate);

/**
 * GET /api/v1/stats/dashboard
 * 대시보드 요약 통계
 */
router.get('/dashboard', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const stats = await statsService.getDashboardStats(userId);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/v1/stats/recent-activity
 * 최근 활동 내역
 */
router.get('/recent-activity', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const limit = parseInt(req.query.limit as string || '10');

        const activity = await statsService.getRecentActivity(userId, limit);
        res.json(activity);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
