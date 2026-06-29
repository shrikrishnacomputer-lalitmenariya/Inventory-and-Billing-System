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
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const where: any = { isActive: true };

    if (categoryId) {
      const catId = parseInt(categoryId);
      const subCats = await prisma.category.findMany({
        where: { parentCategoryId: catId },
        select: { id: true },
      });
      const catIds = [catId, ...subCats.map((sc) => sc.id)];
      where.categoryId = {
        in: catIds,
      };
    }

    if (search) {
      where.name = {
        contains: search,
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mask cost price for staff
    if (session.user.role === "staff") {
      const maskedProducts = products.map((product) => {
        const { costPrice, ...rest } = product;
        return rest;
      });
      return NextResponse.json(maskedProducts);
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      categoryId,
      name,
      brand,
      productType,
      costPrice,
      sellingPrice,
      lowStockThreshold,
      initialQuantity,
      imeis,
      imageUrl,
      barcode,
    } = body;

    if (!categoryId || !name || !productType || !costPrice || !sellingPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.$transaction(async (tx) => {
      // 1. Create the product
      const newProduct = await tx.product.create({
        data: {
          categoryId: parseInt(categoryId),
          name,
          brand,
          productType,
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          lowStockThreshold: parseInt(lowStockThreshold) || 5,
          imageUrl,
          barcode: barcode || null,
          quantityInStock: 0,
        },
      });

      let quantityAdded = 0;

      if (productType === "serialized" || productType === "electronics") {
        if (imeis && Array.isArray(imeis) && imeis.length > 0) {
          quantityAdded = imeis.length;

          // Create product units
          const unitData = imeis.map((imei: string) => ({
            productId: newProduct.id,
            imeiNumber: imei.trim(),
            status: "in_stock",
            costPrice: parseFloat(costPrice),
          }));

          await tx.productUnit.createMany({
            data: unitData,
          });
        }
      } else {
        const qty = parseInt(initialQuantity);
        if (qty && qty > 0) {
          quantityAdded = qty;
        }
      }

      if (quantityAdded > 0) {
        // Create stock-in record
        await tx.stockInRecord.create({
          data: {
            productId: newProduct.id,
            quantityAdded,
            costPrice: parseFloat(costPrice),
            addedByUserId: parseInt(session.user.id),
          },
        });

        // Update the quantity in stock
        return await tx.product.update({
          where: { id: newProduct.id },
          data: {
            quantityInStock: quantityAdded,
          },
        });
      }

      return newProduct;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "One or more IMEIs already exist in the system." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
