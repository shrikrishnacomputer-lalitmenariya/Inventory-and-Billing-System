import { prisma } from "./prisma";

export async function getWhatsappSettings() {
  let settings = await prisma.whatsappSettings.findFirst();
  if (!settings) {
    settings = await prisma.whatsappSettings.create({
      data: {
        ownerPhone: "9928203203",
        status: "disconnected",
        simulateFailures: false,
        simulateSessionError: false,
      },
    });
  }
  return settings;
}

export async function logWhatsappEvent(
  billId: number,
  billNumber: string,
  event: string,
  details: string
) {
  await prisma.whatsappAuditLog.create({
    data: { billId, billNumber, event, details },
  });
}

export async function attemptWhatsappDelivery(deliveryId: number) {
  const delivery = await prisma.whatsappDelivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery) {
    throw new Error("Delivery record not found");
  }

  const bill = await prisma.bill.findUnique({
    where: { id: delivery.billId },
  });

  const settings = await getWhatsappSettings();

  // Log delivery attempt
  await logWhatsappEvent(
    delivery.billId,
    delivery.billNumber,
    "WhatsApp Attempted",
    `Attempting to send PDF to customer ${delivery.customerName} (${delivery.mobileNumber})`
  );

  let status = "sent";
  let failureReason: string | null = null;

  if (settings.status !== "connected" || settings.simulateSessionError) {
    status = "failed";
    failureReason = "Session Not Connected";
  } else if (settings.simulateFailures && delivery.mobileNumber.endsWith("9")) {
    status = "failed";
    failureReason = "Customer is not available on WhatsApp";
  } else if (delivery.mobileNumber.startsWith("000")) {
    status = "failed";
    failureReason = "Invalid Number";
  } else {
    // Attempt real WhatsApp message delivery via daemon
    try {
      const { sendWhatsappMessage } = await import("./whatsapp-daemon");
      
      let messageText = `Hello ${delivery.customerName}, here is your invoice #${delivery.billNumber} from Shree Krishna Computer.`;
      
      if (delivery.customMessage) {
        messageText = delivery.customMessage;
      } else if (bill && Number(bill.dueAmount) > 0) {
        messageText += `\n\n*Payment Reminder:* You have a pending due amount of ₹${bill.dueAmount}. Please settle it at your earliest convenience.`;
      }

      await sendWhatsappMessage(
        delivery.mobileNumber,
        messageText,
        delivery.pdfPath,
        `SKC_Invoice_${delivery.billNumber}.pdf`
      );
    } catch (error: any) {
      console.error("Failed to send WhatsApp message via Baileys:", error);
      status = "failed";
      failureReason = error.message || "Failed to send message";
    }
  }

  const updated = await prisma.whatsappDelivery.update({
    where: { id: deliveryId },
    data: {
      status,
      failureReason,
      sentAt: status === "sent" ? new Date() : null,
    },
  });

  await prisma.bill.update({
    where: { id: delivery.billId },
    data: {
      whatsappStatus: status,
      whatsappSentAt: status === "sent" ? new Date() : null,
    }
  });

  if (status === "sent") {
    await logWhatsappEvent(
      delivery.billId,
      delivery.billNumber,
      "WhatsApp Sent",
      `PDF delivered successfully to ${delivery.mobileNumber}`
    );
  } else {
    await logWhatsappEvent(
      delivery.billId,
      delivery.billNumber,
      "WhatsApp Failed",
      `Delivery failed to ${delivery.mobileNumber}. Reason: ${failureReason}`
    );
  }

  return updated;
}
