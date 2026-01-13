import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
    async register(email: string, password: string, name: string) {
        // 이메일 중복 체크
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            throw new Error('Email already exists');
        }

        // 비밀번호 해싱
        const passwordHash = await bcrypt.hash(password, 10);

        // 사용자 생성
        const user = await prisma.user.create({
            data: { email, passwordHash, name }
        });

        // JWT 발급
        const token = this.generateToken(user.id);

        return {
            user: { id: user.id, email: user.email, name: user.name },
            token
        };
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new Error('Invalid credentials');
        }

        const token = this.generateToken(user.id);

        return {
            user: { id: user.id, email: user.email, name: user.name },
            token
        };
    }

    private generateToken(userId: number): string {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'default-secret-change-this',
            { expiresIn: '7d' }
        );
    }

    verifyToken(token: string) {
        return jwt.verify(
            token,
            process.env.JWT_SECRET || 'default-secret-change-this'
        ) as { userId: number };
    }
}
