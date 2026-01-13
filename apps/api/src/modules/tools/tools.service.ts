import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ToolsService {
    async createTool(userId: number, data: any) {
        const {
            name, category, type, brand, model, serialNumber,
            purchasePrice, purchaseDate, status, condition,
            location, notes, aiPrediction, imageUrl, selectedIndex
        } = data;

        // 1. 공구 생성
        const tool = await prisma.tool.create({
            data: {
                ownerId: userId,
                name,
                category,
                type,
                brand,
                model,
                serialNumber,
                purchasePrice,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                status: status || 'available',
                condition: condition || 'excellent',
                location,
                notes,
            }
        });

        // 2. AI 학습 데이터(AiEvent) 저장 (imageUrl과 aiPrediction이 있을 때만)
        if (imageUrl && aiPrediction) {
            try {
                const candidates = Array.isArray(aiPrediction) ? aiPrediction : aiPrediction.candidates || [];
                const selectedCandidate = selectedIndex !== undefined ? candidates[selectedIndex] : null;

                const groundTruth = { name, category, type, brand, model };

                // AI 정확도 판별 로직
                let isCorrect = false;
                if (selectedCandidate) {
                    const nameMatch = selectedCandidate.name === name;
                    const brandMatch = selectedCandidate.brand === brand;
                    const modelMatch = selectedCandidate.model === model;
                    if (nameMatch && brandMatch && modelMatch) isCorrect = true;
                }

                await prisma.aiEvent.create({
                    data: {
                        imageUrl,
                        aiPrediction: aiPrediction,
                        groundTruth: groundTruth,
                        isCorrect,
                        aiConfidence: selectedCandidate?.confidence || 0,
                        aiProvider: 'gemini',
                        toolId: tool.id,
                        correctedBy: userId,
                    }
                });
            } catch (error) {
                console.error('❌ AI Event logging failed:', error);
            }
        }

        return tool;
    }

    async getTools(userId: number, filters: { search?: string, category?: string }) {
        const { search, category } = filters;

        return await prisma.tool.findMany({
            where: {
                ownerId: userId,
                AND: [
                    search ? { name: { contains: search, mode: 'insensitive' } } : {},
                    category ? { category: category } : {}
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getToolById(userId: number, id: number) {
        const tool = await prisma.tool.findUnique({
            where: { id }
        });

        if (!tool || tool.ownerId !== userId) {
            throw new Error('Tool not found');
        }

        return tool;
    }

    async updateTool(userId: number, id: number, data: any) {
        // 소유권 확인
        await this.getToolById(userId, id);

        if (data.purchaseDate) {
            data.purchaseDate = new Date(data.purchaseDate);
        }

        return await prisma.tool.update({
            where: { id },
            data
        });
    }

    async deleteTool(userId: number, id: number) {
        // 소유권 확인
        await this.getToolById(userId, id);

        return await prisma.tool.delete({
            where: { id }
        });
    }
}
