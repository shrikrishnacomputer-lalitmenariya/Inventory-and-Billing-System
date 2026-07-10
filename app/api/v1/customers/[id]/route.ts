import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatName } from "@/lib/format";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    const body = await req.json();
    let { name, phone, address } = body;

    // Validate inputs
    if (phone && phone.trim().length !== 10) {
      return NextResponse.json({ error: "Valid 10-digit phone number is required" }, { status: 400 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: name ? formatName(name) : undefined,
        phone: phone ? phone.trim() : undefined,
        address: address !== undefined ? address.trim() : undefined,
      },
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error: any) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}
