import React from "react";
import { createRoot } from "react-dom/client";
import InvoiceTemplate from "@/components/InvoiceTemplate";

export async function generateBillPdfBlob(bill: any): Promise<Blob> {
  const jsPDF = (await import("jspdf")).default;
  const html2canvas = (await import("html2canvas-pro")).default;

  // Create hidden container for rendering
  const invoiceEl = document.createElement("div");
  invoiceEl.style.position = "absolute";
  invoiceEl.style.left = "-9999px";
  invoiceEl.style.top = "-9999px";
  invoiceEl.style.width = "680px";
  invoiceEl.style.padding = "0px";
  invoiceEl.style.margin = "0px";
  invoiceEl.style.boxSizing = "border-box";
  invoiceEl.style.background = "white";
  invoiceEl.style.color = "black";
  invoiceEl.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  invoiceEl.style.fontSize = "11px";

  document.body.appendChild(invoiceEl);

  // Prepare bill data for InvoiceTemplate props
  const subtotal = Number(bill.subtotal);
  const discountAmt = Number(bill.discount || 0);
  const totalAmount = Number(bill.totalAmount);
  const sgstPercent = (bill.sgstPercent || 0).toString();
  const cgstPercent = (bill.cgstPercent || 0).toString();
  const paidAmount = Number(bill.paidAmount !== undefined ? bill.paidAmount : bill.totalAmount);
  const dueAmount = Number(bill.dueAmount !== undefined ? bill.dueAmount : 0);

  // Render the InvoiceTemplate React component into the hidden DOM node
  const root = createRoot(invoiceEl);

  await new Promise<void>((resolve) => {
    root.render(
      React.createElement(InvoiceTemplate, {
        isDraft: false,
        billNumber: bill.billNumber,
        createdAt: bill.createdAt,
        customerName: bill.customer?.name || bill.customerName || "Guest Customer",
        customerAddress: bill.customer?.address || undefined,
        customerPhone: bill.customer?.phone || bill.customerPhone || "",
        cartItems: bill.billItems || [],
        subtotal: Number(bill.subtotal),
        grossTotal: Number(bill.totalAmount),
        discount: Number(bill.discount),
        totalAmount: Number(bill.totalAmount),
        sgstPercent: bill.sgstPercent?.toString() || "0",
        cgstPercent: bill.cgstPercent?.toString() || "0",
        paidAmount: Number(bill.paidAmount || 0),
        dueAmount: Number(bill.dueAmount || 0),
        paymentMode: bill.paymentMode || "cash",
      })
    );
    // Allow React to flush the render before capturing
    setTimeout(resolve, 100);
  });

  // Capture the rendered component as a canvas
  const canvas = await html2canvas(invoiceEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  // Cleanup React root and DOM node
  root.unmount();
  document.body.removeChild(invoiceEl);

  // Use JPEG instead of PNG for massive size reduction (e.g. 9MB -> ~100-300KB)
  const imgData = canvas.toDataURL("image/jpeg", 0.8);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pdfWidth - 16; // 8mm margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "JPEG", 8, 8, imgWidth, imgHeight, undefined, "FAST");

  const blob = pdf.output("blob");
  return blob;
}
