import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Basic Counts
    const totalProducts = await prisma.product.count({
      where: { isActive: true }
    });

    const products = await prisma.product.findMany({
      where: { isActive: true }
    });

    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const p of products) {
      totalStockUnits += p.quantityInStock;
      totalStockValue += Number(p.costPrice) * p.quantityInStock;
      if (p.quantityInStock === 0) {
        outOfStockCount++;
      } else if (p.quantityInStock <= p.lowStockThreshold) {
        lowStockCount++;
      }
    }

    const totalCategories = await prisma.category.count({
      where: { isActive: true }
    });

    // 2. Sales calculations (Today's Sales, Monthly Sales)
    const now = new Date();
    
    // Today Start
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Monthly Start
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayBills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: { gte: todayStart }
      }
    });

    const monthBills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: { gte: monthStart }
      }
    });

    const todaySales = todayBills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const monthlySales = monthBills.reduce((sum, b) => sum + Number(b.totalAmount), 0);

    // 3. Category-wise stock distribution
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true }
        }
      }
    });

    const categoryStock = categories.map(cat => {
      const stock = cat.products.reduce((sum, p) => sum + p.quantityInStock, 0);
      return { name: cat.name, stock };
    }).filter(c => c.stock > 0);

    // 4. Sales trends
    // Daily trend (last 7 days)
    const dailyTrend: { name: string; sales: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      
      const dayBills = await prisma.bill.findMany({
        where: {
          status: "completed",
          createdAt: { gte: start, lt: end }
        }
      });
      const daySales = dayBills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
      dailyTrend.push({ name: dateStr, sales: daySales });
    }

    // Weekly trend (last 4 weeks)
    const weeklyTrend: { name: string; sales: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - (i * 7 + 6));
      dStart.setHours(0, 0, 0, 0);
      
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - (i * 7));
      dEnd.setHours(23, 59, 59, 999);

      const weekBills = await prisma.bill.findMany({
        where: {
          status: "completed",
          createdAt: { gte: dStart, lte: dEnd }
        }
      });
      const weekSales = weekBills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
      weeklyTrend.push({ name: `Week -${i}`, sales: weekSales });
    }

    // Monthly trend (last 6 calendar months)
    const monthlyTrend: { name: string; sales: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      
      const mBills = await prisma.bill.findMany({
        where: {
          status: "completed",
          createdAt: { gte: start, lt: end }
        }
      });
      const mSales = mBills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
      monthlyTrend.push({ name: monthLabel, sales: mSales });
    }

    // 5. Product Movement (Fast/Slow moving products)
    const billItems = await prisma.billItem.findMany({
      where: {
        bill: { status: "completed" }
      },
      include: {
        product: true
      }
    });

    const productSalesMap: { [key: number]: { name: string; quantity: number } } = {};
    
    // Initialize active products in map with 0 quantity
    for (const p of products) {
      productSalesMap[p.id] = { name: p.name, quantity: 0 };
    }

    for (const item of billItems) {
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].quantity += item.quantity;
      }
    }

    const movementList = Object.entries(productSalesMap).map(([id, data]) => ({
      id: parseInt(id),
      name: data.name,
      quantity: data.quantity
    }));

    // Sort to find fast moving
    const fastMoving = [...movementList]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .filter(p => p.quantity > 0);

    // Sort to find slow moving (only active products, prioritizing those with stock but low sales)
    const slowMoving = [...movementList]
      .filter(m => {
        const p = products.find(prod => prod.id === m.id);
        return p && p.quantityInStock > 0;
      })
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    return NextResponse.json({
      totalProducts,
      totalStockUnits,
      totalStockValue,
      totalCategories,
      todaySales,
      monthlySales,
      lowStockCount,
      outOfStockCount,
      categoryStock,
      trends: {
        daily: dailyTrend,
        weekly: weeklyTrend,
        monthly: monthlyTrend
      },
      movement: {
        fastMoving,
        slowMoving
      }
    });

  } catch (error) {
    console.error("Error generating dashboard statistics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
