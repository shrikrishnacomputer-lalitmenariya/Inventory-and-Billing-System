// Indian currency to words helper
function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const g = ["", "Thousand", "Lakh", "Crore"];

  const count = (n: number) => {
    let word = "";
    if (n < 20) {
      word = a[n];
    } else if (n < 100) {
      word = b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      word = a[Math.floor(n / 100)] + " Hundred " + count(n % 100);
    }
    return word.trim();
  };

  if (num === 0) return "Zero Rupees Only";

  let words = "";
  let temp = Math.floor(num);

  let chunks = [];
  chunks.push(temp % 1000); // hundreds/tens/ones
  temp = Math.floor(temp / 1000);
  chunks.push(temp % 100);  // thousands
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);  // lakhs
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);  // crores

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk > 0) {
      words = count(chunk) + " " + g[i] + " " + words;
    }
  }

  return (words.trim() + " Rupees Only").replace(/\s+/g, " ");
}

// Shared color constants
const C = {
  navy: "#1b3f8b",
  navyLight: "rgba(27, 63, 139, 0.06)",
  text: "#1f2937",
  textLight: "#4b5563",
  red: "#dc2626",
  white: "#ffffff",
  border: "#1b3f8b",
};

export async function generateBillPdfBlob(bill: any): Promise<Blob> {
  const jsPDF = (await import("jspdf")).default;
  const html2canvas = (await import("html2canvas")).default;

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

  // ── Build item rows ──
  const itemsHtml = bill.billItems?.map((item: any, idx: number) => {
    const pName = item.product?.name || "";
    const pRate = Number(item.unitPrice).toFixed(2);
    const pQty = item.quantity;
    const pTotal = Number(item.lineTotal).toFixed(2);
    const imei = item.productUnit?.imeiNumber;

    return `
      <tr>
        <td style="border: 1px solid ${C.border}; padding: 7px 8px; text-align: center; font-weight: 600; color: ${C.text};">${idx + 1}</td>
        <td style="border: 1px solid ${C.border}; padding: 7px 8px; text-align: left;">
          <span style="font-weight: 700; color: ${C.text};">${pName}</span>
          ${imei ? `<br/><span style="font-size: 8px; color: ${C.textLight}; font-weight: 600;">IMEI: ${imei}</span>` : ""}
        </td>
        <td style="border: 1px solid ${C.border}; padding: 7px 8px; text-align: center; font-weight: 700; color: ${C.text};">${pQty}</td>
        <td style="border: 1px solid ${C.border}; padding: 7px 8px; text-align: right; font-weight: 700; color: ${C.text};">&#8377;${pRate}</td>
        <td style="border: 1px solid ${C.border}; padding: 7px 8px; text-align: right; font-weight: 800; color: ${C.text};">&#8377;${pTotal}</td>
      </tr>
    `;
  }).join("") || "";

  // Fill to minimum 5 rows
  const MIN_ROWS = 5;
  const emptyCount = Math.max(0, MIN_ROWS - (bill.billItems?.length || 0));
  const fillerHtml = Array.from({ length: emptyCount }).map(() => `
    <tr>
      <td style="border: 1px solid ${C.border}; padding: 7px 8px; height: 30px;">&nbsp;</td>
      <td style="border: 1px solid ${C.border}; padding: 7px 8px;">&nbsp;</td>
      <td style="border: 1px solid ${C.border}; padding: 7px 8px;">&nbsp;</td>
      <td style="border: 1px solid ${C.border}; padding: 7px 8px;">&nbsp;</td>
      <td style="border: 1px solid ${C.border}; padding: 7px 8px;">&nbsp;</td>
    </tr>
  `).join("");

  const words = numberToWords(parseFloat(bill.totalAmount));
  const billDate = new Date(bill.createdAt).toLocaleDateString("en-IN");
  const subtotal = Number(bill.subtotal).toFixed(2);
  const discountAmt = Number(bill.discount || 0);
  const taxableAmt = (Number(bill.subtotal) - discountAmt).toFixed(2);
  const totalAmount = Number(bill.totalAmount).toFixed(2);

  const sgstPercent = Number(bill.sgstPercent || 0);
  const cgstPercent = Number(bill.cgstPercent || 0);
  const igstPercent = Number(bill.igstPercent || 0);
  
  const sgstAmount = Number(bill.sgstAmount || 0).toFixed(2);
  const cgstAmount = Number(bill.cgstAmount || 0).toFixed(2);
  const igstAmount = Number(bill.igstAmount || 0).toFixed(2);

  invoiceEl.innerHTML = `
    <div style="border: 3px solid ${C.navy}; background: ${C.white}; box-sizing: border-box; width: 100%;">

      <!-- ════════════ HEADER SECTION ════════════ -->
      <div style="border-bottom: 3px solid ${C.navy}; padding: 14px 18px 10px 18px;">

        <!-- TAX INVOICE badge + GSTIN -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <span style="
              background: ${C.navy};
              color: ${C.white};
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 5px 16px;
              letter-spacing: 1.5px;
            ">TAX INVOICE</span>
          </div>
          <div style="font-size: 13px; font-weight: 900; color: ${C.navy}; letter-spacing: 0.8px;">
            GSTIN : 08BROPM8088G2Z0
          </div>
        </div>

        <!-- Logo + Business Name -->
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 10px;">
          <div style="flex-shrink: 0;">
            <svg viewBox="0 0 64 64" style="width: 52px; height: 52px; color: ${C.navy};" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M30 38 C32 30, 38 18, 48 10 C54 18, 52 30, 42 36 C38 38, 34 39, 30 38 Z" fill="${C.navy}" fill-opacity="0.2" />
              <path d="M34 34 C36 28, 40 20, 46 15 C50 20, 48 28, 42 32 C38 34, 36 34, 34 34 Z" fill="${C.navy}" fill-opacity="0.5" />
              <path d="M37 31 C38 27, 41 23, 44 20 C46 23, 44 27, 41 28 Z" fill="${C.navy}" />
              <path d="M25 42 C22 32, 12 20, 6 20" />
              <line x1="4" y1="58" x2="60" y2="22" stroke-width="2" stroke-linecap="round" />
              <circle cx="14" cy="52" r="1.5" fill="currentColor" />
              <circle cx="22" cy="47" r="1.5" fill="currentColor" />
              <circle cx="30" cy="42" r="1.5" fill="currentColor" />
              <circle cx="38" cy="37" r="1.5" fill="currentColor" />
              <circle cx="46" cy="32" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div style="text-align: center; flex: 1;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; text-transform: uppercase; color: ${C.navy}; letter-spacing: 1px;">
              Shree Krishna Computer
            </h1>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: ${C.text}; font-weight: 600;">
              Main Bus Stand Kanore, Distt. Udaipur
            </p>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: ${C.textLight}; font-weight: 600;">
              &#9993; s.krishnacom.kanore@gmail.com
            </p>
          </div>
          <div style="width: 52px;"></div>
        </div>

        <!-- Category Banner -->
        <div style="
          background: #1b3f8b;
          border-radius: 4px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          color: white;
          margin-bottom: 10px;
        ">

          <!-- Highlighted Quote -->
          <div style="
            background: #facc15;
            color: #1b3f8b;
            font-weight: 900;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 3px;
            white-space: nowrap;
            margin-right: 12px;
          ">
            WE BELIEVE IN QUALITY
          </div>

          <!-- Categories -->
          <div style="
            flex: 1;
            text-align: center;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          ">
            MOBILE | COMPUTER | AC | CCTV | LED TV | REFRIGERATOR | WASHING MACHINE
          </div>

        </div>

        <!-- Owner row -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 800; color: ${C.navy};">
          <div>Owner: <span style="color: ${C.text};">Lalit Menariya</span></div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 13px;">&#9742;</span>
            <span>6375591682</span>
          </div>
        </div>
      </div>

      <!-- ════════════ CUSTOMER + BILL INFO ════════════ -->
      <div style="display: flex; border-bottom: 2px solid ${C.navy};">
        <!-- Left: Customer -->
        <div style="flex: 1; padding: 10px 16px; border-right: 2px solid ${C.navy};">
          <div style="margin-bottom: 6px;">
            <span style="font-weight: 800; color: ${C.navy}; font-size: 11px;">M/s.&nbsp;</span>
            <span style="font-weight: 700; color: ${C.text}; font-size: 12px; text-decoration: underline;">
              ${bill.customer?.name || "Guest Customer"}
            </span>
          </div>
          ${bill.customer?.phone ? `
            <div>
              <span style="font-weight: 800; color: ${C.navy}; font-size: 11px;">Phone:&nbsp;</span>
              <span style="font-weight: 700; color: ${C.text}; font-size: 11px;">${bill.customer.phone}</span>
            </div>
          ` : ""}
        </div>
        <!-- Right: Bill No & Date -->
        <div style="flex: 1; padding: 10px 16px;">
          <div style="margin-bottom: 6px;">
            <span style="font-weight: 800; color: ${C.navy}; font-size: 11px;">Bill No.&nbsp;</span>
            <span style="font-weight: 900; color: ${C.red}; font-size: 13px;">${bill.billNumber}</span>
          </div>
          <div>
            <span style="font-weight: 800; color: ${C.navy}; font-size: 11px;">Date:&nbsp;</span>
            <span style="font-weight: 700; color: ${C.text}; font-size: 11px;">${billDate}</span>
          </div>
        </div>
      </div>

      <!-- ════════════ ITEMS TABLE ════════════ -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background: ${C.navyLight};">
            <th style="border: 1px solid ${C.border}; padding: 8px; text-align: center; width: 40px; font-weight: 800; color: ${C.navy}; font-size: 10px;">No.</th>
            <th style="border: 1px solid ${C.border}; padding: 8px; text-align: left; font-weight: 800; color: ${C.navy}; font-size: 10px;">Particulars</th>
            <th style="border: 1px solid ${C.border}; padding: 8px; text-align: center; width: 50px; font-weight: 800; color: ${C.navy}; font-size: 10px;">Qty.</th>
            <th style="border: 1px solid ${C.border}; padding: 8px; text-align: right; width: 90px; font-weight: 800; color: ${C.navy}; font-size: 10px;">Rate</th>
            <th style="border: 1px solid ${C.border}; padding: 8px; text-align: right; width: 100px; font-weight: 800; color: ${C.navy}; font-size: 10px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          ${fillerHtml}
        </tbody>
      </table>

      <!-- ════════════ BANK DETAILS + TOTALS (side by side) ════════════ -->
      <div style="display: flex; border-top: 2px solid ${C.navy};">

        <!-- Left: Bank Details -->
        <div style="flex: 1; border-right: 2px solid ${C.navy}; padding: 10px 14px;">
          <div style="
            border: 1.5px solid ${C.navy};
            padding: 8px 10px;
            font-size: 9px;
            line-height: 1.6;
            color: ${C.text};
            border-radius: 2px;
          ">
            <div style="font-weight: 900; color: ${C.navy}; text-decoration: underline; margin-bottom: 4px; text-transform: uppercase; font-size: 10px;">
              Bank Details:
            </div>
            <div>Bank : <span style="font-weight: 700;">State Bank of India</span></div>
            <div>IFSC : <span style="font-weight: 700;">SBIN0032015</span></div>
            <div>A/c No. : <span style="font-weight: 700;">61181530264</span></div>
            <div>A/c No. : <span style="font-weight: 700;">61130908984</span></div>
          </div>
        </div>

        <!-- Right: Totals -->
        <div style="flex: 1; padding: 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr style="border-bottom: 1.5px solid ${C.navy};">
              <td style="padding: 7px 14px; font-weight: 800; color: ${C.navy};">Subtotal</td>
              <td style="padding: 7px 14px; text-align: right; font-weight: 800; color: ${C.text};">&#8377;${subtotal}</td>
            </tr>
            ${discountAmt > 0 ? `
              <tr style="border-bottom: 1.5px solid ${C.navy}; background: rgba(239, 68, 68, 0.04);">
                <td style="padding: 7px 14px; font-weight: 800; color: ${C.red};">Discount</td>
                <td style="padding: 7px 14px; text-align: right; font-weight: 800; color: ${C.red};">- &#8377;${discountAmt.toFixed(2)}</td>
              </tr>
            ` : ""}
            <tr style="border-bottom: 1.5px solid ${C.navy}; background: #f8fafc;">
              <td style="padding: 7px 14px; font-weight: 800; color: ${C.navy};">Taxable Amount</td>
              <td style="padding: 7px 14px; text-align: right; font-weight: 800; color: ${C.text};">&#8377;${taxableAmt}</td>
            </tr>
            <tr style="border-bottom: 1.5px solid ${C.navy};">
              <td style="padding: 7px 14px; font-weight: 700; color: ${C.navy};">CGST (${cgstPercent}%)</td>
              <td style="padding: 7px 14px; text-align: right; color: ${C.text};">&#8377;${cgstAmount}</td>
            </tr>
            <tr style="border-bottom: 1.5px solid ${C.navy};">
              <td style="padding: 7px 14px; font-weight: 700; color: ${C.navy};">SGST (${sgstPercent}%)</td>
              <td style="padding: 7px 14px; text-align: right; color: ${C.text};">&#8377;${sgstAmount}</td>
            </tr>
            <tr style="border-bottom: 1.5px solid ${C.navy};">
              <td style="padding: 7px 14px; font-weight: 700; color: ${C.navy};">IGST (${igstPercent}%)</td>
              <td style="padding: 7px 14px; text-align: right; color: ${C.text};">&#8377;${igstAmount}</td>
            </tr>
            <tr style="background: ${C.navyLight};">
              <td style="padding: 9px 14px; font-weight: 900; color: ${C.navy}; font-size: 13px;">G.Total</td>
              <td style="padding: 9px 14px; text-align: right; font-weight: 900; color: ${C.navy}; font-size: 14px;">&#8377;${totalAmount}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- ════════════ AMOUNT IN WORDS ════════════ -->
      <div style="border-top: 2px solid ${C.navy}; padding: 10px 16px;">
        <span style="font-weight: 900; color: ${C.navy}; font-size: 11px;">Rs. (In Word):&nbsp;</span>
        <span style="font-style: italic; text-decoration: underline; font-weight: 700; color: ${C.red}; font-size: 11px;">
          ${words}
        </span>
      </div>

      <!-- ════════════ SIGNATURES ════════════ -->
      <div style="
        border-top: 2px solid ${C.navy};
        padding: 12px 18px 16px 18px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      ">
        <!-- Customer Signature -->
        <div style="text-align: center; width: 140px;">
          <div style="height: 40px;"></div>
          <div style="border-top: 1.5px solid ${C.navy}; padding-top: 4px; font-size: 10px; font-weight: 700; color: ${C.navy};">
            Cust.Signature
          </div>
        </div>

        <!-- Authority Signature -->
        <div style="text-align: center; width: 200px;">
          <div style="font-size: 10px; font-weight: 900; color: ${C.navy}; margin-bottom: 30px;">
            For-SHREE KRISHNA COMPUTER
          </div>
          <div style="border-top: 1.5px solid ${C.navy}; padding-top: 4px; font-size: 10px; font-weight: 700; color: ${C.navy};">
            Auth.Signature
          </div>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(invoiceEl);

  const canvas = await html2canvas(invoiceEl, {
    scale: 2, // Reduced from 2.5 to save size, still sharp enough
    useCORS: true,
    backgroundColor: "#ffffff",
  });

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
