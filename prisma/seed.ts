import 'dotenv/config'
console.log('DEBUG DATABASE_URL:', process.env.DATABASE_URL)
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

const { neonConfig } = require('@neondatabase/serverless')
neonConfig.webSocketConstructor = ws

// Additional debugging
console.log('DATABASE_URL available:', !!process.env.DATABASE_URL)

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Seed/Reset Users
  const adminPasswordHash = await bcrypt.hash('password123', 10)
  const staffPasswordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminPasswordHash,
    },
    create: {
      name: 'Owner',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'owner',
    },
  })

  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {
      passwordHash: staffPasswordHash,
    },
    create: {
      name: 'Staff Member',
      username: 'staff',
      passwordHash: staffPasswordHash,
      role: 'staff',
    },
  })

  console.log('Users seeded:', { admin, staff })

  // 2. Seed/Upsert Parent Categories (using findFirst + create/update pattern)
  let mobileCat = await prisma.category.findFirst({
    where: { name: 'Mobile', parentCategoryId: null }
  })
  if (!mobileCat) {
    mobileCat = await prisma.category.create({
      data: { name: 'Mobile', isActive: true }
    })
  } else {
    mobileCat = await prisma.category.update({
      where: { id: mobileCat.id },
      data: { isActive: true }
    })
  }

  let accCat = await prisma.category.findFirst({
    where: { name: 'Accessories', parentCategoryId: null }
  })
  if (!accCat) {
    accCat = await prisma.category.create({
      data: { name: 'Accessories', isActive: true }
    })
  } else {
    accCat = await prisma.category.update({
      where: { id: accCat.id },
      data: { isActive: true }
    })
  }

  // Ensure "Electronics"
  let elecCat = await prisma.category.findFirst({
    where: { name: 'Electronics', parentCategoryId: null },
  })
  if (!elecCat) {
    elecCat = await prisma.category.create({
      data: { name: 'Electronics', isActive: true },
    })
  } else {
    elecCat = await prisma.category.update({
      where: { id: elecCat.id },
      data: { isActive: true }
    })
  }

  console.log('Parent categories upserted:', { mobileCat, accCat, elecCat })

  // Helper to upsert a subcategory under a parent category ID
  const upsertSubCategory = async (name: string, parentId: number) => {
    let cat = await prisma.category.findFirst({
      where: { name, parentCategoryId: parentId },
    })
    if (!cat) {
      cat = await prisma.category.create({
        data: { name, parentCategoryId: parentId, isActive: true },
      })
    }
    return cat
  }

  // 3. Seed Mobile Subcategories
  const mobileSubs = ['Apple', 'Samsung', 'Oppo', 'Vivo', 'Motorola', 'Poco', 'Tecno', 'Mi', 'Itel']
  const mobileSubMap: Record<string, number> = {}
  for (const name of mobileSubs) {
    const sub = await upsertSubCategory(name, mobileCat.id)
    mobileSubMap[name.toLowerCase()] = sub.id
  }

  // 4. Seed Accessories Subcategories
  const accSubs = ['Charger', 'Mobile Cover', 'Speaker', 'Headphones', 'Smart Watches']
  const accSubMap: Record<string, number> = {}
  for (const name of accSubs) {
    const sub = await upsertSubCategory(name, accCat.id)
    accSubMap[name.toLowerCase()] = sub.id
  }

  // 5. Seed Electronics Subcategories
  const elecSubs = ['Computers & IT Hardware', 'Home Appliances', 'Entertainment']
  const elecSubMap: Record<string, number> = {}
  for (const name of elecSubs) {
    const sub = await upsertSubCategory(name, elecCat.id)
    elecSubMap[name.toLowerCase()] = sub.id
  }

  console.log('Subcategories seeded.')

  // 6. Migrate existing products to subcategories
  const products = await prisma.product.findMany()
  for (const p of products) {
    const pNameLower = p.name.toLowerCase()
    const pBrandLower = p.brand ? p.brand.toLowerCase().trim() : ''
    let targetCatId: number | null = null

    // Determine correct subcategory based on name/brand
    if (pNameLower.includes('iphone') || pBrandLower.includes('apple')) {
      targetCatId = mobileSubMap['apple']
    } else if (pNameLower.includes('samsung') || pBrandLower.includes('samsung')) {
      targetCatId = mobileSubMap['samsung']
    } else if (pNameLower.includes('poco') || pBrandLower.includes('poco')) {
      targetCatId = mobileSubMap['poco']
    } else if (pNameLower.includes('cover') || pBrandLower.includes('cover')) {
      targetCatId = accSubMap['mobile cover']
    }

    if (targetCatId) {
      await prisma.product.update({
        where: { id: p.id },
        data: { categoryId: targetCatId },
      })
      console.log(`Migrated product "${p.name}" to category ID ${targetCatId}`)
    }
  }

  // 7. Cleanup legacy Smartphones category (if exists and no products reference it)
  try {
    const legacySmartphoneCat = await prisma.category.findUnique({
      where: { id: 3 },
    })
    if (legacySmartphoneCat) {
      // Re-verify that no products are still referencing categoryId = 3
      const productCount = await prisma.product.count({
        where: { categoryId: 3 },
      })
      if (productCount === 0) {
        await prisma.category.delete({
          where: { id: 3 },
        })
        console.log('Deleted legacy Smartphones category (ID 3).')
      } else {
        console.warn(`Cannot delete category ID 3: ${productCount} products still referencing it.`)
      }
    }
  } catch (err) {
    // Category ID 3 might not exist or might be Electronics (no issue)
    console.log('Category cleanup completed (or skipped).')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
