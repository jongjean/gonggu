import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware.js';
import { RentalsService } from './rentals.service.js';

const router = Router();
const rentalsService = new RentalsService();

router.use(authenticate);

// 대여 신청
router.post('/', async (req, res) => {
    try {
        const schema = z.object({
            toolId: z.number(),
            borrowerId: z.number(),
            dueDate: z.string().optional(),
            notes: z.string().optional()
        });

        const data = schema.parse(req.body);
        const userId = (req as any).userId;

        const rental = await rentalsService.createRental(userId, data);
        res.status(201).json({ rental });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 내 대여 목록
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { type } = req.query;

        const rentals = await rentalsService.getRentals(userId, type as string);
        res.json({ rentals, total: rentals.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 진행 중인 대여 목록
router.get('/active/list', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const rentals = await rentalsService.getActiveRentals(userId);
        res.json({ rentals, total: rentals.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 대여 상세
router.get('/:id', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const id = parseInt(req.params.id);

        const rental = await rentalsService.getRentalById(userId, id);
        res.json({ rental });
    } catch (error: any) {
        const status = error.message === 'Rental not found' ? 404 : 403;
        res.status(status).json({ error: error.message });
    }
});

// 반납 처리
router.patch('/:id/return', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const id = parseInt(req.params.id);

        const rental = await rentalsService.returnTool(userId, id);
        res.json({ rental });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
