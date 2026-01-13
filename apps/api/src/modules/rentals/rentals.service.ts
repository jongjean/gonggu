import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RentalsService {
    async createRental(userId: number, data: any) {
        const { toolId, borrowerId, dueDate, notes } = data;

        // 1. 공구 확인 및 권한 체크
        const tool = await prisma.tool.findUnique({
            where: { id: toolId }
        });

        if (!tool || tool.ownerId !== userId) {
            throw new Error('Tool not found');
        }

        if (tool.status !== 'available') {
            throw new Error('Tool is not available');
        }

        // 2. 대여 생성 및 공구 상태 업데이트 (트랜잭션)
        return await prisma.$transaction(async (tx) => {
            const rental = await tx.rental.create({
                data: {
                    toolId,
                    lenderId: userId,
                    borrowerId,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes
                }
            });

            await tx.tool.update({
                where: { id: toolId },
                data: { status: 'rented' }
            });

            return rental;
        });
    }

    async getRentals(userId: number, type?: string) {
        let where: any = { lenderId: userId };

        if (type === 'borrowed') {
            where = { borrowerId: userId };
        } else if (type === 'lent') {
            where = { lenderId: userId };
        }

        return await prisma.rental.findMany({
            where,
            include: {
                tool: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getActiveRentals(userId: number) {
        return await prisma.rental.findMany({
            where: {
                lenderId: userId,
                returnedAt: null
            },
            include: {
                tool: true
            },
            orderBy: { startDate: 'desc' }
        });
    }

    async getRentalById(userId: number, id: number) {
        const rental = await prisma.rental.findUnique({
            where: { id },
            include: { tool: true }
        });

        if (!rental) {
            throw new Error('Rental not found');
        }

        if (rental.lenderId !== userId && rental.borrowerId !== userId) {
            throw new Error('Unauthorized');
        }

        return rental;
    }

    async returnTool(userId: number, id: number) {
        const rental = await prisma.rental.findUnique({
            where: { id }
        });

        if (!rental) {
            throw new Error('Rental not found');
        }

        if (rental.returnedAt) {
            throw new Error('Already returned');
        }

        if (rental.lenderId !== userId) {
            throw new Error('Only lender can mark as returned');
        }

        // 반납 처리 및 공구 상태 업데이트 (트랜잭션)
        return await prisma.$transaction(async (tx) => {
            const updatedRental = await tx.rental.update({
                where: { id },
                data: { returnedAt: new Date() }
            });

            await tx.tool.update({
                where: { id: rental.toolId },
                data: { status: 'available' }
            });

            return updatedRental;
        });
    }
}
