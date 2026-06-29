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
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // 1. Try to find by Product Barcode
    const productByBarcode = await prisma.product.findUnique({
      where: { barcode: code },
      include: {
        category: true,
        units: {
          where: { status: "in_stock" }
        }
      }
    });

    if (productByBarcode) {
      if (!productByBarcode.isActive) {
        return NextResponse.json({ error: "Product is inactive" }, { status: 400 });
      }
      return NextResponse.json({
        type: "product",
        data: productByBarcode
      });
    }

    // 2. Try to find by ProductUnit IMEI
    const productUnit = await prisma.productUnit.findUnique({
      where: { imeiNumber: code },
      include: {
        product: {
          include: {
            category: true,
            units: {
              where: { status: "in_stock" }
            }
          }
        }
      }
    });

    if (productUnit) {
      if (productUnit.status !== "in_stock") {
        return NextResponse.json({ error: `This unit is currently ${productUnit.status}` }, { status: 400 });
      }
      if (!productUnit.product.isActive) {
        return NextResponse.json({ error: "Product is inactive" }, { status: 400 });
      }
      return NextResponse.json({
        type: "imei",
        unitId: productUnit.id,
        data: productUnit.product
      });
    }

    // Not found anywhere
    return NextResponse.json({ error: "No product or IMEI found for this barcode" }, { status: 404 });

  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Failed to process scan" }, { status: 500 });
  }
}
