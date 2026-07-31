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
    const parentCategoryId = searchParams.get("parentCategoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build the query where clause
    const where: any = {};

    if (fromDate || toDate) {
      where.bill = {
        createdAt: {
          ...(fromDate && { gte: new Date(fromDate) }),
          ...(toDate && { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) }),
        },
      };
    }

    if (subCategoryId) {
      where.product = { categoryId: parseInt(subCategoryId) };
    } else if (parentCategoryId) {
      where.product = {
        category: {
          parentCategoryId: parseInt(parentCategoryId),
        },
      };
    }

    const billItems = await prisma.billItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        bill: {
          createdAt: 'desc'
        }
      },
      include: {
        bill: {
          include: {
            customer: true,
          }
        },
        product: {
          include: {
            category: true,
          }
        },
        productUnit: true,
      }
    });

    // Also get total count for pagination if needed
    const total = await prisma.billItem.count({ where });

    return NextResponse.json({
      items: billItems,
      total,
      page,
      limit,
      hasMore: skip + billItems.length < total
    });
  } catch (error) {
    console.error("Error fetching sold items:", error);
    return NextResponse.json({ error: "Failed to fetch sold items" }, { status: 500 });
  }
}
