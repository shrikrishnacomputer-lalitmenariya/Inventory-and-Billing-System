import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const billId = parseInt(resolvedParams.id);
    if (isNaN(billId)) {
      return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
    }

    // Get the current bill
    const currentBill = await prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!currentBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Mark as paid
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: {
        paymentStatus: "PAID",
        paidAmount: currentBill.totalAmount, // Assuming they paid the remaining amount
        dueAmount: 0,
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Error settling due payment:", error);
    return NextResponse.json(
      { error: "Failed to settle payment" },
      { status: 500 }
    );
  }
}
