const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  
  try {
    // Start a transaction to ensure all or nothing
    await prisma.$transaction(async (tx) => {
      console.log('1. Deleting all Finance Records associated with Bills...');
      const financeRecordsResult = await tx.financeRecord.deleteMany({});
      console.log(`-> Deleted ${financeRecordsResult.count} Finance Records.`);

      console.log('2. Deleting all Bill Items...');
      const billItemsResult = await tx.billItem.deleteMany({});
      console.log(`-> Deleted ${billItemsResult.count} Bill Items.`);

      console.log('3. Deleting all Bills...');
      const billsResult = await tx.bill.deleteMany({});
      console.log(`-> Deleted ${billsResult.count} Bills.`);
    });
    
    console.log('✅ Successfully cleared all bills and associated items from the database.');
  } catch (error) {
    console.error('❌ Error clearing the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
