import jsPDF from "jspdf";

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceData {
  orderNumber: string;
  customerName: string;
  date: string;
  paymentMethod: string;
  status: string;
  total?: number;
  price?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  discountAmount?: number;
  items?: InvoiceItem[];
}

export function generateInvoicePDF(order: InvoiceData): void {
  const doc = new jsPDF();
  const grandTotal = Number(order.total ?? order.price ?? 0);
  const ptsEarned = Number(order.pointsEarned ?? Math.floor(grandTotal / 10));
  const ptsRedeemed = Number(order.pointsRedeemed ?? 0);
  const discount = Number(order.discountAmount ?? 0);

  // Dark Slate Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");

  // Title Branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ApparelSync CRM", 15, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(16, 185, 129); // Emerald accent
  doc.text("OFFICIAL RETAIL SALES INVOICE", 15, 30);

  // Invoice Number & Date
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`INVOICE #${order.orderNumber || "N/A"}`, 135, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${order.date || new Date().toISOString().split("T")[0]}`, 135, 30);

  // Bill To & Order Info Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO:", 15, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(order.customerName || "Walk-in Customer", 15, 63);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS:", 135, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Method: ${order.paymentMethod || "Cash"}`, 135, 63);
  doc.text(`Status: ${(order.status || "COMPLETED").toUpperCase()}`, 135, 70);

  // Horizontal Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 80, 195, 80);

  // Items Table Header Box
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 87, 180, 10, "F");

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ITEM DESCRIPTION", 20, 93.5);
  doc.text("QTY", 120, 93.5);
  doc.text("UNIT PRICE", 145, 93.5);
  doc.text("TOTAL", 175, 93.5);

  let currentY = 105;

  const itemsList: InvoiceItem[] =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            name: `Apparel Item Purchase (Order #${order.orderNumber})`,
            quantity: 1,
            unitPrice: grandTotal + discount,
            totalPrice: grandTotal + discount,
          },
        ];

  itemsList.forEach((item) => {
    const uPrice = Number(item.unitPrice ?? 0);
    const tPrice = Number(item.totalPrice ?? 0);
    const qty = item.quantity ?? 1;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text((item.name || "Apparel Item").slice(0, 45), 20, currentY);
    doc.text(qty.toString(), 122, currentY);
    doc.text(`$${uPrice.toFixed(2)}`, 145, currentY);
    doc.text(`$${tPrice.toFixed(2)}`, 175, currentY);
    currentY += 10;
  });

  doc.line(15, currentY, 195, currentY);
  currentY += 12;

  // Reward Points & Discount Summary Box
  doc.setFillColor(240, 253, 244); // Soft Emerald tint
  doc.rect(15, currentY, 95, 25, "F");
  doc.setDrawColor(187, 247, 208);
  doc.rect(15, currentY, 95, 25, "S");

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("REWARD POINTS SUMMARY", 20, currentY + 7);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Points Earned: +${ptsEarned} PTS`, 20, currentY + 14);
  if (ptsRedeemed > 0) {
    doc.text(`Points Redeemed: ${ptsRedeemed} PTS (-$${discount.toFixed(2)})`, 20, currentY + 20);
  }

  // Subtotal & Grand Total Summary
  if (discount > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal:", 120, currentY + 7);
    doc.text(`$${(grandTotal + discount).toFixed(2)}`, 165, currentY + 7);

    doc.text("Points Discount:", 120, currentY + 13);
    doc.setTextColor(225, 29, 72);
    doc.text(`-$${discount.toFixed(2)}`, 165, currentY + 13);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Total Paid:", 120, currentY + 22);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.text(`$${grandTotal.toFixed(2)}`, 165, currentY + 22);
  } else {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Total Amount Paid:", 120, currentY + 12);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.text(`$${grandTotal.toFixed(2)}`, 165, currentY + 12);
  }

  // Footer Note
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Thank you for shopping with ApparelSync CRM!", 15, 275);

  // Trigger PDF file download
  doc.save(`Invoice-${order.orderNumber || "Receipt"}.pdf`);
}
