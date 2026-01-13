import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'demo@gonggubanjang.com';
    const password = 'demo1234';
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
        where: { email },
        update: { passwordHash, name: '데모 사용자' },
        create: {
            email,
            passwordHash,
            name: '데모 사용자',
            role: 'user'
        }
    });

    console.log('✅ Demo user created/updated: demo@gonggubanjang.com / demo1234');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
