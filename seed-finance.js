const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const providers = ["Bajaj", "Home Credit", "TVS", "DMI"];
  
  for (const name of providers) {
    await prisma.financeProvider.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  
  console.log("Seeded finance providers successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
