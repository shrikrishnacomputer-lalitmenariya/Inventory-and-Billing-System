const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.billItem.count({
    where: { bill: { billNumber: { contains: '339' } } }
  });
  console.log('BillItems count:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
