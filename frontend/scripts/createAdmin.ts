import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = 'admin@cosmonft.com';
  const password = 'admin123'; // Change this after first login!

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      role: 'SUPER_ADMIN',
    },
    create: {
      email,
      passwordHash,
      name: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('Admin account ready:');
  console.log('  Email:', email);
  console.log('  Password: admin123');
  console.log('  (Change this password after logging in!)');
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
