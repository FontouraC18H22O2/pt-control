require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');

async function main() {
  console.log('🌱 A iniciar o processo de seeding da base de dados...');

  const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });

  const adminUsername = 'admin_pt';
  const plainPassword = 'DiogoCerqueira05@';

  const existingAdmin = await prisma.userAdmin.findUnique({
    where: { username: adminUsername },
  });

  if (existingAdmin) {
    console.log(`⚠️ O utilizador "${adminUsername}" já existe. Seed cancelado.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await prisma.userAdmin.create({
    data: {
      username: adminUsername,
      passwordHash: hashedPassword,
      isActive: true,
      failedAttempts: 0,
    },
  });

  console.log(`✅ Administrador "${adminUsername}" criado com sucesso!`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});