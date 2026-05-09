import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@nutrilens.app';
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: 'Demo User',
      passwordHash,
      hasOnboarded: true,
      profile: {
        create: {
          age: 30,
          gender: 'OTHER',
          heightCm: 175,
          weightKg: 72,
          activityLevel: 'MODERATE',
          goalType: 'MAINTAIN',
          goalSpeed: 'BALANCED',
          dietaryPreferences: [],
          unitSystem: 'METRIC',
          timezone: 'UTC',
        },
      },
      targets: {
        create: {
          dailyCalories: 2400,
          proteinGrams: 150,
          carbsGrams: 270,
          fatGrams: 80,
          fiberGrams: 34,
          waterMl: 2400,
        },
      },
    },
    update: {},
  });

  console.log(`Seeded demo user: ${user.email} / demo1234`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
