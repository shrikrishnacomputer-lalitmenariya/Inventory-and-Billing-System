import { NextResponse } from "next/server";
import { attemptWhatsappDelivery } from "@/lib/whatsapp";

export async function POST(
  req: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { deliveryId } = body;

    if (!deliveryId) {
      return NextResponse.json({ error: "Missing deliveryId" }, { status: 400 });
    }

    const updatedDelivery = await attemptWhatsappDelivery(Number(deliveryId));
    return NextResponse.json({ success: true, delivery: updatedDelivery });
  } catch (error: any) {
    console.error("Error resending WhatsApp message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend message" },
      { status: 500 }
    );
  }
}
