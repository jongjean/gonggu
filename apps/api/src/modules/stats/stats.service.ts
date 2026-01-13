import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StatsService {
    async getDashboardStats(userId: number) {
        // 전체 공구 정보 가져오기
        const allTools = await prisma.tool.findMany({
            where: { ownerId: userId }
        });

        const totalTools = allTools.length;

        // 상태별 집계
        const available = allTools.filter(t => t.status === 'available').length;
        const rented = allTools.filter(t => t.status === 'rented').length;
        const maintenance = allTools.filter(t => t.status === 'maintenance').length;
        const lost = allTools.filter(t => t.status === 'lost').length;

        // 컨디션 집계
        const excellent = allTools.filter(t => t.condition === 'excellent').length;
        const good = allTools.filter(t => t.condition === 'good').length;
        const fair = allTools.filter(t => t.condition === 'fair').length;
        const poor = allTools.filter(t => t.condition === 'poor').length;

        // 대여 정보 가져오기
        const allRentals = await prisma.rental.findMany({
            where: { lenderId: userId }
        });

        const activeRentals = allRentals.filter(r => !r.returnedAt).length;
        const completedRentals = allRentals.filter(r => r.returnedAt).length;

        // 카테고리 집계
        const categories: Record<string, number> = {};
        allTools.forEach(tool => {
            if (tool.category) {
                categories[tool.category] = (categories[tool.category] || 0) + 1;
            }
        });

        return {
            summary: {
                totalTools,
                available,
                rented,
                maintenance,
                lost,
            },
            condition: {
                excellent,
                good,
                fair,
                poor,
            },
            rentals: {
                active: activeRentals,
                completed: completedRentals,
                total: allRentals.length,
            },
            categories,
        };
    }

    async getRecentActivity(userId: number, limit: number = 10) {
        const recentTools = await prisma.tool.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        const recentRentals = await prisma.rental.findMany({
            where: { lenderId: userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { tool: true }
        });

        return {
            recentTools,
            recentRentals,
        };
    }
}
