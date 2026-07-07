import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, quantity } = body;

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid product or quantity" }, { status: 400 });
    }

    const createdByUserId = parseInt(session.user.id);

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: parseInt(productId) },
        include: { category: true },
      });

      if (!product || !product.isActive) {
        throw new Error("Product not found or inactive.");
      }

      if (product.quantityInStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.quantityInStock}`);
      }

      // Decrement stock
      await tx.product.update({
        where: { id: product.id },
        data: { quantityInStock: { decrement: quantity } },
      });

      const lineTotal = Number(product.sellingPrice) * quantity;
      
      const lastQsBill = await tx.bill.findFirst({
        where: { billNumber: { startsWith: "QS-" } },
        orderBy: { id: 'desc' }
      });
      let nextBillNo = "QS-100";
      if (lastQsBill) {
        const lastNo = parseInt(lastQsBill.billNumber.replace("QS-", ""), 10);
        if (!isNaN(lastNo)) {
          nextBillNo = `QS-${lastNo + 1}`;
        }
      }

      // Create a ghost bill to track revenue
      const billData = {
        billNumber: nextBillNo,
        createdByUserId,
        subtotal: lineTotal,
        discount: 0,
        sgstPercent: 0,
        cgstPercent: 0,
        sgstAmount: 0,
        cgstAmount: 0,
        totalAmount: lineTotal,
        paidAmount: lineTotal,
        dueAmount: 0,
        paymentStatus: "PAID",
        paymentMode: "cash",
        status: "completed",
        billItems: {
          create: [{
            productId: product.id,
            quantity: quantity,
            unitPrice: product.sellingPrice,
            lineTotal: lineTotal,
          }],
        },
      };

      const bill = await tx.bill.create({
        data: billData,
        include: {
          billItems: true,
        },
      });

      return bill;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error processing quick sell:", error);
    return NextResponse.json({ error: error.message || "Failed to process quick sell" }, { status: 400 });
  }
}
