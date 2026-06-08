require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 A preparar a criação do PT de teste...');

  // Dados limpos de acordo com o teu novo Schema do Prisma
  const nomePT = 'Diogo Cerqueira';
  const emailPT = 'diogo@ginasio.com'; 
  const passwordCrua = 'DiogoCerqueira05@'; 

  // Criptografar a password com bcrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(passwordCrua, saltRounds);

  // Inserir no MariaDB sem o campo "username"
  const ptAcesso = await prisma.userAdmin.create({
    data: {
      nome: nomePT,
      email: emailPT,
      passwordHash: passwordHash,
      isActive: true
    }
  });

  console.log('\n===============================================');
  console.log('✅ PERSONAL TRAINER CRIADO COM SUCESSO!');
  console.log(`👤 Nome: ${ptAcesso.nome}`);
  console.log(`📧 Email: ${ptAcesso.email}`);
  console.log(`🔑 Password: ${passwordCrua}`);
  console.log('===============================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar o utilizador:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });