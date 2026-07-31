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

    // 1. Basic Counts & Stock
    // Fetch only needed fields instead of entire product row
    const productsLite = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, quantityInStock: true, costPrice: true, lowStockThreshold: true }
    });

    const totalProducts = productsLite.length;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const p of productsLite) {
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

    // 2. Sales calculations (Today & Month)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayBills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: { gte: todayStart }
      },
      include: {
        billItems: {
          include: {
            product: true,
            productUnit: true
          }
        }
      }
    });

    let todayProfit = 0;
    let todaySales = 0;
    const todaySoldItems: any[] = [];
    
    for (const b of todayBills) {
      todaySales += Number(b.totalAmount);
      for (const item of b.billItems) {
        const itemSellingPrice = Number(item.unitPrice) * item.quantity;
        const itemCostPrice = item.productUnit
          ? Number(item.productUnit.costPrice) * item.quantity
          : Number(item.product.costPrice) * item.quantity;
        todayProfit += (itemSellingPrice - itemCostPrice);
        
        todaySoldItems.push({
          id: item.id,
          productName: item.product.name,
          productType: item.product.productType,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
          imeiNumber: item.productUnit?.imeiNumber,
          billNumber: b.billNumber
        });
      }
    }

    const monthlySalesAgg = await prisma.bill.aggregate({
      where: {
        status: "completed",
        createdAt: { gte: monthStart }
      },
      _sum: { totalAmount: true }
    });
    const monthlySales = Number(monthlySalesAgg._sum.totalAmount || 0);

    // 3. Category-wise stock distribution
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        name: true,
        products: {
          where: { isActive: true },
          select: { quantityInStock: true }
        }
      }
    });

    const categoryStock = categories.map(cat => ({
      name: cat.name,
      stock: cat.products.reduce((sum, p) => sum + p.quantityInStock, 0)
    })).filter(c => c.stock > 0);

    // 4. Sales trends
    // Fetch all completed bills from the last 6 months once (selecting only date & amount)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const allRecentBills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: { gte: sixMonthsAgo }
      },
      select: { createdAt: true, totalAmount: true }
    });

    // Daily trend (last 7 days)
    const dailyTrend: { name: string; sales: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      
      const daySales = allRecentBills
        .filter(b => b.createdAt.getTime() >= start && b.createdAt.getTime() < end)
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);
        
      dailyTrend.push({ name: dateStr, sales: daySales });
    }

    // Weekly trend (last 4 weeks)
    const weeklyTrend: { name: string; sales: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - (i * 7 + 6));
      dStart.setHours(0, 0, 0, 0);
      const start = dStart.getTime();
      
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - (i * 7));
      dEnd.setHours(23, 59, 59, 999);
      const end = dEnd.getTime();

      const weekSales = allRecentBills
        .filter(b => b.createdAt.getTime() >= start && b.createdAt.getTime() <= end)
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);
        
      weeklyTrend.push({ name: `Week -${i}`, sales: weekSales });
    }

    // Monthly trend (last 6 calendar months)
    const monthlyTrend: { name: string; sales: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      
      const mSales = allRecentBills
        .filter(b => b.createdAt.getTime() >= start && b.createdAt.getTime() < end)
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);
        
      monthlyTrend.push({ name: monthLabel, sales: mSales });
    }

    // 5. Product Movement (Fast/Slow moving products)
    // Filtered to last 30 days, using database grouping!
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const movementAgg = await prisma.billItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        bill: {
          status: "completed",
          createdAt: { gte: thirtyDaysAgo }
        }
      }
    });

    const fastMoving = movementAgg
      .map(agg => {
        const p = productsLite.find(prod => prod.id === agg.productId);
        return {
          id: agg.productId,
          name: p ? p.name : "Unknown",
          quantity: agg._sum.quantity || 0
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .filter(p => p.quantity > 0);

    const slowMoving = productsLite
      .filter(p => p.quantityInStock > 0)
      .map(p => {
        const agg = movementAgg.find(a => a.productId === p.id);
        return {
          id: p.id,
          name: p.name,
          quantity: agg ? (agg._sum.quantity || 0) : 0
        };
      })
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    return NextResponse.json({
      totalProducts,
      totalStockUnits,
      totalStockValue,
      totalCategories,
      todayProfit,
      todaySales,
      todaySoldItems,
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
