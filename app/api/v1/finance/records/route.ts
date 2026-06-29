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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";

    const records = await prisma.financeRecord.findMany({
      where: {
        bill: {
          OR: [
            { customer: { name: { contains: search } } },
            { customer: { phone: { contains: search } } },
            { billNumber: { contains: search } },
          ],
        },
      },
      include: {
        bill: {
          include: {
            customer: true,
          },
        },
        financeProvider: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Flatten data for the frontend table
    const data = records.map((record) => ({
      id: record.id,
      billId: record.bill.id,
      billNumber: record.bill.billNumber,
      createdAt: record.createdAt,
      customerName: record.bill.customer?.name || "Guest",
      customerPhone: record.bill.customer?.phone || "N/A",
      providerName: record.financeProvider.name,
      emiAmount: record.emiAmount,
      months: (record as any).months,
      totalAmount: record.bill.totalAmount,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching finance records:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}
