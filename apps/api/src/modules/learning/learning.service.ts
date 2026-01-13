import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LearningService {
    async saveFeedback(userId: number, data: any) {
        const {
            imageUrl, aiPrediction, groundTruth, isCorrect,
            correctionType, toolId, feedback
        } = data;

        // AiEvent 모델에 데이터 저장
        return await prisma.aiEvent.create({
            data: {
                imageUrl,
                aiPrediction,
                groundTruth,
                isCorrect,
                aiConfidence: aiPrediction?.confidence || 0,
                aiProvider: aiPrediction?.provider || 'gemini',
                toolId,
                feedback,
                correctedBy: userId,
            }
        });
    }

    async saveCorrection(userId: number, data: any) {
        const {
            trainingDataId, originalField, originalValue, correctedValue, reason
        } = data;

        return await prisma.aiCorrection.create({
            data: {
                aiEventId: trainingDataId,
                userId,
                originalField,
                originalValue,
                correctedValue,
                reason
            }
        });
    }

    async getStats(userId: number) {
        const allEvents = await prisma.aiEvent.findMany();
        const userEvents = await prisma.aiEvent.findMany({
            where: { correctedBy: userId }
        });

        const total = allEvents.length;
        const correct = allEvents.filter(e => e.isCorrect === true).length;
        const modified = allEvents.filter(e => e.groundTruth !== null && e.isCorrect === false).length;
        // correctionType 필드가 명확하지 않으므로 로직으로 판단 (혹은 필요시 필드 추가)

        const accuracy = total > 0 ? (correct / total * 100).toFixed(1) : "0";

        return {
            total,
            correct,
            modified,
            accuracy: parseFloat(accuracy),
            userContributions: userEvents.length
        };
    }

    async getLearningData(limit: number = 50, offset: number = 0) {
        const data = await prisma.aiEvent.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                corrections: true
            }
        });

        return {
            data,
            total: data.length,
            limit,
            offset
        };
    }

    async getLearningDataById(id: number) {
        const data = await prisma.aiEvent.findUnique({
            where: { id },
            include: {
                corrections: true,
                tool: true
            }
        });

        if (!data) {
            throw new Error('Not found');
        }

        return data;
    }

    async getAnalysis() {
        const allEvents = await prisma.aiEvent.findMany();

        // 카테고리별 정확도 분석
        const byCategory: Record<string, { total: number; correct: number }> = {};

        allEvents.forEach(event => {
            const groundTruth = event.groundTruth as any;
            const category = groundTruth?.category || 'unknown';

            if (!byCategory[category]) {
                byCategory[category] = { total: 0, correct: 0 };
            }

            byCategory[category].total++;
            if (event.isCorrect) {
                byCategory[category].correct++;
            }
        });

        const categoryAccuracy = Object.entries(byCategory).map(([category, stats]) => ({
            category,
            total: stats.total,
            correct: stats.correct,
            accuracy: (stats.correct / stats.total * 100).toFixed(1)
        }));

        // 최근 7일 트렌드
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentEvents = allEvents.filter(e => e.createdAt >= sevenDaysAgo);

        return {
            overall: {
                total: allEvents.length,
                correct: allEvents.filter(e => e.isCorrect).length,
                accuracy: allEvents.length > 0
                    ? (allEvents.filter(e => e.isCorrect).length / allEvents.length * 100).toFixed(1)
                    : 0
            },
            byCategory: categoryAccuracy,
            recent7Days: {
                total: recentEvents.length,
                correct: recentEvents.filter(e => e.isCorrect).length
            }
        };
    }
}
