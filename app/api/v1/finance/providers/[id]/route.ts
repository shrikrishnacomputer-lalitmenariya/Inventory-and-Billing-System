import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const providerId = parseInt(id);
    if (isNaN(providerId)) {
      return NextResponse.json({ error: "Invalid provider ID" }, { status: 400 });
    }

    // Soft delete
    const provider = await prisma.financeProvider.update({
      where: { id: providerId },
      data: { isActive: false }
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error deleting finance provider:", error);
    return NextResponse.json({ error: "Failed to delete provider" }, { status: 500 });
  }
}
