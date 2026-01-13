import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes.js';
import analyzeRoutes from './routes/analyze.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api/v1', (req, res) => {
    res.json({
        message: '🛠️ 공구반장 API v2.0',
        endpoints: {
            auth: '/api/v1/auth',
            tools: '/api/v1/tools',
            analyze: '/api/v1/analyze',
            rentals: '/api/v1/rentals',
            upload: '/api/v1/upload',
            stats: '/api/v1/stats',
            learning: '/api/v1/learning'
        }
    });
});

// 라우터
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/analyze', analyzeRoutes);

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// 서버 시작
app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛠️  공구반장 API VER 0.1');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 http://localhost:${PORT}`);
    console.log(`📊 /healthz | /api/v1`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

export default app;
