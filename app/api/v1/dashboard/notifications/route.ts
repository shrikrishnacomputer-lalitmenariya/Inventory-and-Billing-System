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

    // Fetch active products with stock <= lowStockThreshold OR stock = 0
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          {
            quantityInStock: 0
          },
          {
            quantityInStock: {
              lte: prisma.product.fields.lowStockThreshold
            }
          }
        ]
      },
      include: {
        category: true
      }
    });

    // Classify and prioritize
    const alerts = products.map(p => {
      let severity: "critical" | "danger" | "warning";
      let message = "";
      
      if (p.quantityInStock === 0) {
        severity = "critical"; // Red
        message = `🔴 Out of Stock: "${p.name}" is out of stock.`;
      } else if (p.quantityInStock <= 2) {
        severity = "danger"; // Orange
        message = `⚠️ Critical Low Stock: "${p.name}" has only ${p.quantityInStock} items left (Threshold: ${p.lowStockThreshold}).`;
      } else {
        severity = "warning"; // Yellow
        message = `⚠️ Low Stock: "${p.name}" has ${p.quantityInStock} items left (Threshold: ${p.lowStockThreshold}).`;
      }

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        quantity: p.quantityInStock,
        threshold: p.lowStockThreshold,
        category: p.category?.name || "Uncategorized",
        severity,
        message,
        createdAt: new Date() // For sorting/rendering
      };
    });

    // Sort by severity weight: critical = 3, danger = 2, warning = 1
    const severityWeight = { critical: 3, danger: 2, warning: 1 };
    alerts.sort((a, b) => {
      const weightA = severityWeight[a.severity] || 0;
      const weightB = severityWeight[b.severity] || 0;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return a.quantity - b.quantity; // lower quantity first for equal severity
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching low-stock notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
