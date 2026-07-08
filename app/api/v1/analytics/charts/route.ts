import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days") || "30";
    const days = parseInt(daysParam);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch active completed bills
    const bills = await prisma.bill.findMany({
      where: {
        status: "completed",
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        billItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            productUnit: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 1. Sales Trend (group by day)
    const trendMap: { [key: string]: { date: string; sales: number; profit: number } } = {};
    
    // Initialize trendMap for last N days so we don't have gaps
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      trendMap[dateStr] = { date: dateStr, sales: 0, profit: 0 };
    }

    // 2. Category breakdown
    const categoryMap: { [key: string]: number } = {};

    // 3. Payment mode breakdown
    const paymentMap: { [key: string]: number } = { cash: 0, upi: 0, card: 0 };

    for (const bill of bills) {
      const dateStr = new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const billRevenue = Number(bill.totalAmount); // using final Gross Total (Selling Price after discount)
      
      let billCost = 0;
      for (const item of bill.billItems) {
        const itemCost = item.productUnit
          ? Number(item.productUnit.costPrice)
          : Number(item.product.costPrice);
        billCost += itemCost * item.quantity;

        // Categorize sales
        const catName = item.product.category?.name || "Uncategorized";
        categoryMap[catName] = (categoryMap[catName] || 0) + (Number(item.unitPrice) * item.quantity);
      }

      const billProfit = billRevenue - billCost;

      if (trendMap[dateStr]) {
        trendMap[dateStr].sales += billRevenue;
        trendMap[dateStr].profit += billProfit;
      } else {
        // Fallback for dates outside initialized map
        trendMap[dateStr] = { date: dateStr, sales: billRevenue, profit: billProfit };
      }

      // Payment Mode
      const mode = bill.paymentMode.toLowerCase();
      if (paymentMap[mode] !== undefined) {
        paymentMap[mode] += billRevenue;
      }
    }

    const salesTrend = Object.values(trendMap).map(t => ({
      ...t,
      sales: Number(t.sales.toFixed(2)),
      profit: Number(t.profit.toFixed(2))
    }));
    
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
    
    const paymentData = Object.entries(paymentMap).map(([name, value]) => ({
      name: name.toUpperCase(),
      value: Number(value.toFixed(2)),
    }));

    return NextResponse.json({
      salesTrend,
      categoryData,
      paymentData,
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}
