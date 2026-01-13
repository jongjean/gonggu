import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../modules/auth/auth.middleware.js';

const router = Router();

// 업로드 디렉토리 설정
const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `tool-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, JPG, WEBP allowed.'));
        }
    },
});

// 모든 업로드 라우트에 인증 적용
router.use(authenticate);

// 단일 이미지 업로드 (기존 프론트엔드 호환용)
router.post('/', upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.status(201).json({
            success: true,
            imageUrl: `/uploads/${req.file.filename}`,
            url: `/uploads/${req.file.filename}`,
            file: {
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype,
            },
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/v1/upload/image
 * 단일 이미지 업로드
 */
router.post('/image', upload.single('image'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.status(201).json({
            success: true,
            file: {
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype,
                url: `/uploads/${req.file.filename}`,
            },
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/v1/upload/images
 * 여러 이미지 업로드 (최대 5개)
 */
router.post('/images', upload.array('images', 5), (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const fileInfos = files.map((file) => ({
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            url: `/uploads/${file.filename}`,
        }));

        res.status(201).json({
            success: true,
            files: fileInfos,
            count: fileInfos.length,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * DELETE /api/v1/upload/:filename
 * 업로드된 파일 삭제
 */
router.delete('/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.json({ success: true, message: 'File deleted' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
