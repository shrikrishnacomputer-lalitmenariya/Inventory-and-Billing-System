import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        units: {
          where: { status: "in_stock" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (session.user.role === "staff") {
      const { costPrice, ...rest } = product;
      return NextResponse.json(rest);
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const body = await req.json();
    const {
      categoryId,
      name,
      brand,
      productType,
      costPrice,
      sellingPrice,
      lowStockThreshold,
      imageUrl,
      isActive,
      barcode,
    } = body;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        name,
        brand,
        productType,
        costPrice,
        sellingPrice,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
        imageUrl,
        isActive,
        barcode: barcode || null,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    // Soft delete
    const deletedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return NextResponse.json(deletedProduct);
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
