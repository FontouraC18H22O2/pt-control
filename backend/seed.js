cat << 'EOF' > seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('A iniciar semente...');
  const hash = await bcrypt.hash('Admin@257-05', 10);
  
  await prisma.userAdmin.upsert({
    where: { email: 'admin@gym.com' },
    update: {},
    create: {
      nome: 'admin',
      email: 'admin@gym.com',
      passwordHash: hash,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false
    }
  });
  
  console.log('ADMINISTRADOR CRIADO COM SUCESSO');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF