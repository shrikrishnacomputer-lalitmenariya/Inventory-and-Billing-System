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
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { phone },
    });

    return NextResponse.json(customer || null);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
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
    let { name, phone } = body;
    name = formatName(name);

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Check if customer already exists
    let customer = await prisma.customer.findFirst({
      where: { phone },
    });

    if (customer) {
      // Update name if it was empty or changed
      if (name && customer.name !== name) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { name },
        });
      }
    } else {
      customer = await prisma.customer.create({
        data: { name, phone },
      });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
