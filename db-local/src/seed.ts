const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function run() {
  await db.$connect();

  const buyer = await db.user.upsert({
    where: { wallet: 'BuyerWalletPubKey' },
    update: {},
    create: { wallet: 'BuyerWalletPubKey', name: 'Buyer Demo' },
  });

  const seller = await db.user.upsert({
    where: { wallet: 'SellerWalletPubKey' },
    update: {},
    create: { wallet: 'SellerWalletPubKey', name: 'Seller Demo' },
  });

  await db.deal.create({
    data: {
      buyerId: buyer.id,
      sellerId: seller.id,
      priceUsd: '149.99',
      description: 'Demo escrow from UI stepper',
      fundingDeadline: new Date(Date.now() + 3*24*3600*1000),
      completionDeadline: new Date(Date.now() + 7*24*3600*1000),
      status: 'INIT',
    },
  });

  console.log('🌱 Seeded demo users + deal');
  await db.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

