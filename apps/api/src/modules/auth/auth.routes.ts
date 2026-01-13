import { Router } from 'express';
import { AuthService } from './auth.service.js';
import { authenticate } from './auth.middleware.js';

const router = Router();
const authService = new AuthService();

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const result = await authService.register(email, password, name);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

router.get('/me', authenticate, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const user = await authService.getUserById(userId);
        res.json({ user });
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

export default router;
