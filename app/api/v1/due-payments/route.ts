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
    const search = searchParams.get("search") || "";
    // If 'overdue' is true, we only fetch bills older than 15 days
    const overdueOnly = searchParams.get("overdue") === "true";

    const whereClause: any = {
      paymentStatus: "PARTIAL",
      OR: [
        { billNumber: { contains: search } },
        { customer: { phone: { contains: search } } },
        { customer: { name: { contains: search } } },
      ],
    };

    if (overdueOnly) {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      whereClause.createdAt = {
        lt: fifteenDaysAgo,
      };
    }

    const dueBills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(dueBills);
  } catch (error) {
    console.error("Error fetching due payments:", error);
    return NextResponse.json({ error: "Failed to fetch due payments" }, { status: 500 });
  }
}
