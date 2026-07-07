import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attemptWhatsappDelivery, logWhatsappEvent } from "@/lib/whatsapp";
import path from "path";
import fs from "fs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const billId = parseInt(resolvedParams.id);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customerName = formData.get("customerName") as string || "Customer";
    const mobileNumber = formData.get("mobileNumber") as string || "";
    const billNumber = formData.get("billNumber") as string || "";
    const customMessage = formData.get("customMessage") as string || null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    // Save PDF to public/uploads/invoices
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // We cannot save files to /public in Vercel Serverless (read-only filesystem)
    // So we will just store a virtual path in the DB and pass the base64 directly to the delivery function.
    const filename = `SKC_Invoice_${billNumber}.pdf`;
    const relativePath = `uploads/invoices/${filename}`;
    const base64String = buffer.toString('base64');

    // Create delivery record
    const delivery = await prisma.whatsappDelivery.create({
      data: {
        billId,
        billNumber,
        customerName,
        mobileNumber,
        pdfPath: relativePath,
        customMessage,
        status: "pending",
      },
    });

    // Update Bill model so the history page sees it as pending immediately
    await prisma.bill.update({
      where: { id: billId },
      data: { whatsappStatus: "pending" }
    });

    await logWhatsappEvent(
      billId,
      billNumber,
      "WhatsApp Queued",
      `Invoice PDF delivery queued for ${customerName} (${mobileNumber})`
    );

    // In Vercel serverless, we MUST await background tasks or they get killed
    try {
      await attemptWhatsappDelivery(delivery.id, base64String);
    } catch (err) {
      console.error("WhatsApp delivery failed:", err);
      // We still return success since the PDF uploaded and delivery was queued/failed gracefully
    }

    return NextResponse.json({ success: true, delivery });
  } catch (error: any) {
    console.error("Error uploading bill PDF/sending WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
