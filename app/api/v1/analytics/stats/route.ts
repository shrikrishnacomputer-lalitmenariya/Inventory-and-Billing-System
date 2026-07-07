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

    // Fetch all active completed bills within the timeframe
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
            product: true,
            productUnit: true,
          },
        },
      },
    });

    let totalSales = 0;
    let totalCost = 0;

    for (const bill of bills) {
      // bill.subtotal in DB is now the tax-extracted base amount (already discounted)
      totalSales += Number(bill.subtotal);

      for (const item of bill.billItems) {
        if (item.productUnit) {
          totalCost += Number(item.productUnit.costPrice) * item.quantity;
        } else {
          totalCost += Number(item.product.costPrice) * item.quantity;
        }
      }
    }

    const netSales = totalSales;
    const totalProfit = netSales - totalCost;

    // Fetch low stock items count
    const lowStockCount = await prisma.product.count({
      where: {
        isActive: true,
        quantityInStock: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
    });

    return NextResponse.json({
      totalSales: netSales.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      totalBills: bills.length,
      lowStockCount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
