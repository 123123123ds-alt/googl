import { resolve } from 'path';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_EMAIL;
  const password = process.env.BOOTSTRAP_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing BOOTSTRAP_EMAIL or BOOTSTRAP_PASSWORD');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const matches = await bcrypt.compare(password, existing.password);
    if (!matches) {
      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { password: hashed },
      });
    }
  } else {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashed,
      },
    });
  }

  console.info(`Bootstrap user ready: ${email}`);
}

main()
  .catch((error) => {
    console.error('Prisma seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
