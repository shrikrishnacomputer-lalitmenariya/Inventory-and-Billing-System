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

    const providers = await prisma.financeProvider.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Error fetching finance providers:", error);
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Provider name is required" }, { status: 400 });
    }

    // Upsert to handle re-activating previously deleted (inactive) providers
    const provider = await prisma.financeProvider.upsert({
      where: { name: name.trim() },
      update: { isActive: true },
      create: { name: name.trim() }
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error("Error creating finance provider:", error);
    return NextResponse.json({ error: "Failed to create provider" }, { status: 500 });
  }
}
