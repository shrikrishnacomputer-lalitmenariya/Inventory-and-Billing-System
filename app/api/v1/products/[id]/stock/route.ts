import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const body = await req.json();
    const { quantity, imeis, costPrice } = body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const actualCostPrice = costPrice || product.costPrice;

    // Use Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      let quantityAdded = 0;

      if (product.productType === "serialized" || product.productType === "electronics") {
        if (!imeis || !Array.isArray(imeis) || imeis.length === 0) {
          throw new Error(
            product.productType === "electronics"
              ? "S M Numbers are required for electronics products"
              : "IMEIs are required for serialized products"
          );
        }

        quantityAdded = imeis.length;

        // Create product units
        const unitData = imeis.map((imei: string) => ({
          productId,
          imeiNumber: imei,
          status: "in_stock",
          costPrice: actualCostPrice,
        }));

        await tx.productUnit.createMany({
          data: unitData,
        });

      } else {
        if (!quantity || quantity <= 0) {
          throw new Error("Valid quantity is required for quantity-based products");
        }
        quantityAdded = parseInt(quantity);
      }

      // 1. Create Stock In Record
      const stockIn = await tx.stockInRecord.create({
        data: {
          productId,
          quantityAdded,
          costPrice: actualCostPrice,
          addedByUserId: parseInt(session.user.id),
        },
      });

      // 2. Update Product Quantity
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          quantityInStock: {
            increment: quantityAdded,
          },
        },
      });

      return { stockIn, updatedProduct };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error adding stock:", error);
    // Handle unique constraint violation for IMEIs
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "One or more IMEIs already exist in the system." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to add stock" }, { status: 500 });
  }
}
