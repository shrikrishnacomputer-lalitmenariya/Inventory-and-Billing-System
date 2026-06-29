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

    const bills = await prisma.bill.findMany({
      where: {
        paymentStatus: "PAID",
        OR: [
          { billNumber: { contains: search } },
          { customer: { phone: { contains: search } } },
          { customer: { name: { contains: search } } },
        ],
      },
      include: {
        customer: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },
        billItems: {
          include: {
            product: true,
            productUnit: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}

import { formatName } from "@/lib/format";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { 
      customerName, customerPhone, paymentMode, discount = 0, items,
      sgstPercent = 0, cgstPercent = 0, igstPercent = 0, paidAmount,
      financeProviderId, emiAmount, financeMonths
    } = body;

    customerName = formatName(customerName);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!paymentMode) {
      return NextResponse.json({ error: "Payment mode is required" }, { status: 400 });
    }

    const createdByUserId = parseInt(session.user.id);

    // Run creation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or Find Customer
      let customerId: number | null = null;
      if (customerPhone) {
        let customer = await tx.customer.findFirst({
          where: { phone: customerPhone },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: customerName || null,
              phone: customerPhone,
            },
          });
        } else if (customerName && customer.name !== customerName) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { name: customerName },
          });
        }
        customerId = customer.id;
      }

      // 2. Generate Sequential Bill Number
      const count = await tx.bill.count();
      const nextBillNo = (4900 + count + 1).toString();

      // 3. Process Cart Items and calculate totals
      let subtotal = 0;
      const billItemsData = [];

      for (const item of items) {
        const { productId, quantity, productUnitId } = item;
        const qty = parseInt(quantity);

        const product = await tx.product.findUnique({
          where: { id: parseInt(productId) },
        });

        if (!product || !product.isActive) {
          throw new Error(`Product with ID ${productId} not found or inactive.`);
        }

        const price = product.sellingPrice;
        const lineTotal = Number(price) * qty;
        subtotal += lineTotal;

        if (product.productType === "serialized" || product.productType === "electronics") {
          // Serialized: quantity must be 1 per unit
          if (!productUnitId) {
            throw new Error(
              product.productType === "electronics"
                ? `Product unit (S M No.) is required for electronics product: ${product.name}`
                : `Product unit (IMEI) is required for serialized product: ${product.name}`
            );
          }

          const unit = await tx.productUnit.findUnique({
            where: { id: parseInt(productUnitId) },
          });

          if (!unit || unit.status !== "in_stock") {
            throw new Error(
              product.productType === "electronics"
                ? `Selected S M No. unit is no longer available.`
                : `Selected IMEI unit is no longer available.`
            );
          }

          // Mark unit as sold
          await tx.productUnit.update({
            where: { id: unit.id },
            data: { status: "sold", soldAt: new Date() },
          });

          // Decrement product stock by 1
          await tx.product.update({
            where: { id: product.id },
            data: { quantityInStock: { decrement: 1 } },
          });

          billItemsData.push({
            productId: product.id,
            productUnitId: unit.id,
            quantity: 1,
            unitPrice: price,
            lineTotal: lineTotal,
          });

        } else {
          // Quantity based product
          if (product.quantityInStock < qty) {
            throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.quantityInStock}`);
          }

          // Decrement product stock
          await tx.product.update({
            where: { id: product.id },
            data: { quantityInStock: { decrement: qty } },
          });

          billItemsData.push({
            productId: product.id,
            quantity: qty,
            unitPrice: price,
            lineTotal: lineTotal,
          });
        }
      }

      const discountVal = parseFloat(discount) || 0;
      const taxableAmount = subtotal - discountVal;

      const sgstAmt = taxableAmount * (parseFloat(sgstPercent) / 100);
      const cgstAmt = taxableAmount * (parseFloat(cgstPercent) / 100);
      const igstAmt = taxableAmount * (parseFloat(igstPercent) / 100);

      const totalAmount = taxableAmount + sgstAmt + cgstAmt + igstAmt;

      const actualPaid = paidAmount !== undefined ? parseFloat(paidAmount) : totalAmount;
      const dueAmount = totalAmount - actualPaid;
      const paymentStatus = dueAmount > 0 ? "PARTIAL" : "PAID";

      // 4. Create the Bill
      const billData: any = {
        billNumber: nextBillNo,
        customerId,
        createdByUserId,
        subtotal,
        discount: discountVal,
        sgstPercent: parseFloat(sgstPercent) || 0,
        cgstPercent: parseFloat(cgstPercent) || 0,
        igstPercent: parseFloat(igstPercent) || 0,
        sgstAmount: sgstAmt,
        cgstAmount: cgstAmt,
        igstAmount: igstAmt,
        totalAmount,
        paidAmount: actualPaid,
        dueAmount: dueAmount,
        paymentStatus: paymentStatus,
        paymentMode,
        status: "completed",
        billItems: {
          create: billItemsData,
        },
      };

      if (paymentMode.toLowerCase() === "finance" && financeProviderId && emiAmount !== undefined) {
        billData.financeRecord = {
          create: {
            financeProviderId: parseInt(financeProviderId),
            emiAmount: parseFloat(emiAmount),
            months: financeMonths ? parseInt(financeMonths) : null,
          }
        };
      }

      const bill = await tx.bill.create({
        data: billData,
        include: {
          customer: true,
          billItems: {
            include: {
              product: true,
              productUnit: true,
            },
          },
          financeRecord: {
            include: {
              financeProvider: true
            }
          }
        },
      });

      return bill;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bill:", error);
    return NextResponse.json({ error: error.message || "Failed to create bill" }, { status: 400 });
  }
}
