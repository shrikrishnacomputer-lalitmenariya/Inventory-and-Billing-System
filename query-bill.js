const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const bill = await prisma.bill.findFirst({
    orderBy: { id: 'desc' },
    include: { customer: true }
  });
  console.log(bill);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
