import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

const authService = new AuthService();

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    try {
        const payload = authService.verifyToken(token);
        (req as any).userId = payload.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
