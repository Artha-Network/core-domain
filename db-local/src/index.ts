const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  await db.$connect();
  console.log(' Connected to PostgreSQL');
  const count = await db.user.count();
  console.log('User count:', count);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

