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

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    // Save PDF to public/uploads/invoices
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "invoices");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `SKC_Invoice_${billNumber}.pdf`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    const relativePath = `uploads/invoices/${filename}`;

    // Create delivery record
    const delivery = await prisma.whatsappDelivery.create({
      data: {
        billId,
        billNumber,
        customerName,
        mobileNumber,
        pdfPath: relativePath,
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
      `Invoice PDF saved and delivery queued for ${customerName} (${mobileNumber})`
    );

    // Run delivery asynchronously in the background so the UI doesn't hang
    attemptWhatsappDelivery(delivery.id).catch((err) => {
      console.error("Background WhatsApp delivery failed:", err);
    });

    return NextResponse.json({ success: true, delivery });
  } catch (error: any) {
    console.error("Error uploading bill PDF/sending WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
