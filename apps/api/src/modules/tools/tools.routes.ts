import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { ToolsService } from './tools.service.js';

const router = Router();
const toolsService = new ToolsService();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

router.post('/', async (req, res) => {
    try {
        const schema = z.object({
            name: z.string(),
            category: z.string().nullable().optional(),
            type: z.string().nullable().optional(),
            brand: z.string().nullable().optional(),
            model: z.string().nullable().optional(),
            serialNumber: z.string().nullable().optional(),
            purchasePrice: z.number().nullable().optional(),
            purchaseDate: z.string().nullable().optional(),
            status: z.enum(['available', 'rented', 'maintenance', 'lost']).nullable().optional(),
            condition: z.enum(['excellent', 'good', 'fair', 'poor']).nullable().optional(),
            location: z.string().nullable().optional(),
            notes: z.string().nullable().optional(),
            aiPrediction: z.any().nullable().optional(),
            imageUrl: z.string().nullable().optional(),
            selectedIndex: z.number().nullable().optional()
        });

        const data = schema.parse(req.body);
        const userId = (req as any).userId;

        const tool = await toolsService.createTool(userId, data);
        res.status(201).json({ tool });
    } catch (error: any) {
        console.error('❌ Tool registration failed:', error);
        if (error instanceof z.ZodError) {
            console.error('❌ Validation Error:', error.issues);
            return res.status(400).json({ error: 'Validation failed', detail: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
});

// 공구 목록
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { search, category } = req.query;

        const tools = await toolsService.getTools(userId, {
            search: search as string,
            category: category as string
        });

        res.json({ tools, total: tools.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 공구 상세
router.get('/:id', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const id = parseInt(req.params.id);

        const tool = await toolsService.getToolById(userId, id);
        res.json({ tool });
    } catch (error: any) {
        const status = error.message === 'Tool not found' ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
});

// 공구 수정
router.patch('/:id', async (req, res) => {
    try {
        const schema = z.object({
            name: z.string().optional(),
            category: z.string().optional(),
            type: z.string().optional(),
            brand: z.string().optional(),
            model: z.string().optional(),
            status: z.enum(['available', 'rented', 'maintenance', 'lost']).optional(),
            condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
            location: z.string().optional(),
            notes: z.string().optional()
        });

        const data = schema.parse(req.body);
        const userId = (req as any).userId;
        const id = parseInt(req.params.id);

        const tool = await toolsService.updateTool(userId, id, data);
        res.json({ tool });
    } catch (error: any) {
        const status = error.message === 'Tool not found' ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
});

// 공구 삭제
router.delete('/:id', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const id = parseInt(req.params.id);

        await toolsService.deleteTool(userId, id);
        res.json({ message: 'Tool deleted' });
    } catch (error: any) {
        const status = error.message === 'Tool not found' ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
});

export default router;
