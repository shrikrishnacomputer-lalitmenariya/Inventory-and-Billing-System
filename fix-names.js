const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function formatName(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

async function main() {
  const customers = await prisma.customer.findMany();
  let updated = 0;
  for (const c of customers) {
    if (c.name) {
      const formatted = formatName(c.name);
      if (formatted !== c.name) {
        await prisma.customer.update({
          where: { id: c.id },
          data: { name: formatted }
        });
        updated++;
      }
    }
  }
  console.log(`Updated ${updated} customer names to Title Case.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
