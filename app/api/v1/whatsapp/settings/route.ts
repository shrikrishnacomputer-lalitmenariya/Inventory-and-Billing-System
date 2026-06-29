import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWhatsappSettings } from "@/lib/whatsapp";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getWhatsappSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error fetching WhatsApp settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { status, simulateFailures, simulateSessionError } = body;

    const currentSettings = await getWhatsappSettings();

    // Trigger daemon lifecycle based on requested status
    if (status === "connecting") {
      // Update DB to "connecting" FIRST so the frontend can start polling immediately
      await prisma.whatsappSettings.update({
        where: { id: currentSettings.id },
        data: { status: "connecting", qrCode: null },
      });

      // Then fire the daemon (async — it will update qrCode in DB when ready)
      const { initWhatsappSocket } = await import("@/lib/whatsapp-daemon");
      initWhatsappSocket().catch((err) =>
        console.error("Error starting WA daemon:", err)
      );

      // Return the updated settings with "connecting" status
      const updated = await getWhatsappSettings();
      return NextResponse.json(updated);
    }

    if (status === "disconnected") {
      const { disconnectWhatsapp } = await import("@/lib/whatsapp-daemon");
      await disconnectWhatsapp();

      const updated = await getWhatsappSettings();
      return NextResponse.json(updated);
    }

    // Generic update (simulateFailures, simulateSessionError, etc.)
    const updated = await prisma.whatsappSettings.update({
      where: { id: currentSettings.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(simulateFailures !== undefined ? { simulateFailures } : {}),
        ...(simulateSessionError !== undefined ? { simulateSessionError } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating WhatsApp settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
