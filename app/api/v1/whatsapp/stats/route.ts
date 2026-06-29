import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalDeliveries, sentCount, failedCount, pendingCount] = await Promise.all([
      prisma.whatsappDelivery.count(),
      prisma.whatsappDelivery.count({ where: { status: "sent" } }),
      prisma.whatsappDelivery.count({ where: { status: "failed" } }),
      prisma.whatsappDelivery.count({ where: { status: "pending" } }),
    ]);

    return NextResponse.json({
      totalDeliveries,
      sentCount,
      failedCount,
      pendingCount,
    });
  } catch (error: any) {
    console.error("Error fetching WhatsApp stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
