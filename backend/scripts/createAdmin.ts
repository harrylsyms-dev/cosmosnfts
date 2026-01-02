import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error('Usage: npx ts-node scripts/createAdmin.ts <email> <password> [name]');
    console.error('Example: npx ts-node scripts/createAdmin.ts admin@cosmonfts.com MySecurePass123 "Admin Name"');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters');
    process.exit(1);
  }

  console.log('Creating admin user...');
  console.log(`Email: ${email}`);

  // Check if admin already exists
  const existing = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    console.log('Admin user already exists!');
    console.log(`ID: ${existing.id}`);
    console.log(`Email: ${existing.email}`);
    console.log(`Role: ${existing.role}`);
    process.exit(0);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create admin
  const admin = await prisma.adminUser.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('\nAdmin created successfully!');
  console.log(`ID: ${admin.id}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Name: ${admin.name}`);
  console.log(`Role: ${admin.role}`);
  console.log(`\nYou can now login at /admin/login`);

  // Initialize site settings
  const settings = await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      isLive: false,
      maintenanceMode: false,
      comingSoonMode: true,
      comingSoonTitle: 'CosmoNFT is Coming Soon',
      comingSoonMessage: 'Own a piece of the universe. Celestial objects immortalized as NFTs. Scientifically scored. Dynamically priced. 30% supports space exploration.',
    },
  });

  console.log('\nSite settings initialized:');
  console.log(`Coming Soon Mode: ${settings.comingSoonMode}`);
  console.log(`Is Live: ${settings.isLive}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
