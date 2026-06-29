const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findFirst({
    where: { phone: "6375591682" }
  });
  console.log(customer);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
