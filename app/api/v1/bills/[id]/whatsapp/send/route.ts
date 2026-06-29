import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logWhatsappEvent } from "@/lib/whatsapp";

export async function GET(
  req: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const billId = parseInt(resolvedParams.id);
    const deliveries = await prisma.whatsappDelivery.findMany({
      where: { billId },
      orderBy: { id: "desc" },
    });
    const logs = await prisma.whatsappAuditLog.findMany({
      where: { billId },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, deliveries, logs });
  } catch (error: any) {
    console.error("Error fetching bill delivery data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}
