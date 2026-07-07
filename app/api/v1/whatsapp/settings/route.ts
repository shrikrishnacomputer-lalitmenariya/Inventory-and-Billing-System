import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWhatsappSettings } from "@/lib/whatsapp";
import { isBotConfigured, botConnect, botDisconnect, botStatus } from "@/lib/whatsapp-client";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // In production (Railway bot configured), fetch status from bot
    if (isBotConfigured()) {
      try {
        const botData = await botStatus();
        return NextResponse.json(botData);
      } catch (err) {
        // If bot is unreachable, fall back to DB
        console.error("Bot unreachable, falling back to DB:", err);
      }
    }

    // Fallback: read from database directly (works locally + as safety net)
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
      // In production, tell the Railway bot to connect
      if (isBotConfigured()) {
        await botConnect();
        // Return current settings (frontend will poll for QR via GET)
        const updated = await getWhatsappSettings();
        return NextResponse.json(updated);
      }

      // Local dev: use in-process daemon
      await prisma.whatsappSettings.update({
        where: { id: currentSettings.id },
        data: { status: "connecting", qrCode: null },
      });

      const { initWhatsappSocket } = await import("@/lib/whatsapp-daemon");
      initWhatsappSocket().catch((err) =>
        console.error("Error starting WA daemon:", err)
      );

      const updated = await getWhatsappSettings();
      return NextResponse.json(updated);
    }

    if (status === "disconnected") {
      // In production, tell the Railway bot to disconnect
      if (isBotConfigured()) {
        try {
          await botDisconnect();
        } catch (err) {
          console.error("Failed to reach bot for disconnect, but updating DB anyway:", err);
          // If bot is offline, we MUST still update DB or frontend gets stuck forever
          await prisma.whatsappSettings.update({
            where: { id: currentSettings.id },
            data: { status: "disconnected", qrCode: null },
          });
        }
        const updated = await getWhatsappSettings();
        return NextResponse.json(updated);
      }

      // Local dev: use in-process daemon
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
