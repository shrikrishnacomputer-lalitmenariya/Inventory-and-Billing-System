import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ unitId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { unitId } = await params;
    const id = parseInt(unitId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid unit ID" }, { status: 400 });
    }

    const body = await req.json();
    const { imeiNumber } = body;

    if (!imeiNumber || imeiNumber.trim() === "") {
      return NextResponse.json({ error: "IMEI number is required" }, { status: 400 });
    }

    // Check if the IMEI already exists in ANY product unit
    const existingUnit = await prisma.productUnit.findUnique({
      where: { imeiNumber: imeiNumber.trim() },
    });

    if (existingUnit && existingUnit.id !== id) {
      return NextResponse.json({ error: "This IMEI number is already present in the system." }, { status: 400 });
    }

    const updatedUnit = await prisma.productUnit.update({
      where: { id },
      data: { imeiNumber: imeiNumber.trim() },
    });

    return NextResponse.json(updatedUnit);
  } catch (error: any) {
    console.error("Error updating product unit:", error);
    
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "This IMEI number is already present in the system." }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to update IMEI" }, { status: 500 });
  }
}
