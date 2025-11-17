import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SignImage from "../data/sign.jpg";

const UPI_ID = "jawaharlalr10@oksbi";
const PAYEE_NAME = "PR Stationers";

function generateUPIString(amount) {
  return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    PAYEE_NAME
  )}&am=${amount}&cu=INR`;
}

async function generateQR(upiString) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      upiString
    )}`;
    img.onload = () => resolve(img);
  });
}

export const generateInvoicePDF = async (order, asBlob = false) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  /* ------------------------------------------------------------
      WATERMARK
  ------------------------------------------------------------- */
  doc.setFontSize(60);
  doc.setTextColor(240);
  doc.text("PAID", pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 45,
  });
  doc.setTextColor(0);

  /* ------------------------------------------------------------
      HEADER
  ------------------------------------------------------------- */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text("PR STATIONERS", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(12);
  doc.text("Phone: 9884609789", pageWidth / 2, 26, { align: "center" });

  doc.text(
    "No: 144, Velachery Main Road, Pallikaranai, Chennai - 60100",
    pageWidth / 2,
    34,
    { align: "center" }
  );

  /* ------------------------------------------------------------
      ORDER DETAILS
  ------------------------------------------------------------- */
  let y = 50;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Order Details", 14, y);

  y += 10;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);

  doc.text(`Order ID: ${order.orderId}`, 14, y);
  doc.text(`Customer: ${order.userName}`, 14, y + 8);
  doc.text(`Phone: ${order.userPhone}`, 14, y + 16);

  const wrappedAddress = doc.splitTextToSize(order.address, pageWidth - 30);
  doc.text("Address:", 14, y + 24);
  doc.text(wrappedAddress, 34, y + 24);

  /* ------------------------------------------------------------
      PLACEHOLDER ABOVE TABLE
  ------------------------------------------------------------- */
  const placeY = y + 45;

  doc.setFontSize(10);
  doc.setFont("Helvetica", "italic");
  doc.text("Items purchased are listed below:", 14, placeY - 4);

  doc.setLineWidth(0.2);
  doc.rect(12, placeY - 10, pageWidth - 24, 8);

  /* ------------------------------------------------------------
      ITEMS TABLE
  ------------------------------------------------------------- */
  const tableRows = order.items.map((item, i) => [
    i + 1,
    item.name,
    item.selectedOptions?.color || "-",
    item.selectedOptions?.size || "-",
    item.quantity,
    "Rs " + item.price,
    "Rs " + item.price * item.quantity,
  ]);

  autoTable(doc, {
    startY: placeY + 5,
    theme: "grid",
    head: [["S.no", "Product", "Color", "Size", "Qty", "Price", "Total"]],
    body: tableRows,
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    styles: { fontSize: 10, textColor: 0 },
    margin: { left: 14, right: 14 },
    pageBreak: "auto",
  });

  /* ------------------------------------------------------------
      SUMMARY SECTION
  ------------------------------------------------------------- */
  let summaryY = doc.lastAutoTable.finalY + 15;

  if (summaryY > pageHeight - 70) {
    doc.addPage();
    summaryY = 20;
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Summary", 14, summaryY);

  doc.setFontSize(11);
  doc.setFont("Helvetica", "normal");

  doc.text(`Total Items: ${order.totalItems}`, 14, summaryY + 10);
  doc.text(`Total Qty: ${order.totalQty}`, 14, summaryY + 18);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Total Amount: Rs ${order.totalPrice}`, 14, summaryY + 30);

  /* ------------------------------------------------------------
      SIGNATURE (LEFT) + QR (RIGHT)
  ------------------------------------------------------------- */
  const qrString = generateUPIString(order.totalPrice);
  const qrImage = await generateQR(qrString);

  const boxY = summaryY + 55;

  // Signature
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Digital Signature:", 14, boxY);

  doc.addImage(SignImage, "JPEG", 14, boxY + 5, 50, 20);

  doc.setFont("Helvetica", "italic");
  doc.setFontSize(10);
  doc.text("Signed Electronically by R. Jawaharlal", 14, boxY + 30);

  // QR Code
  const qrX = pageWidth - 65;
  const qrY = boxY - 15;
  doc.addImage(qrImage, "PNG", qrX, qrY, 55, 55);
  doc.link(qrX, qrY, 55, 55, { url: qrString });

  doc.setFontSize(12);
  doc.text(`Scan QR to Pay – ${order.userName}`, qrX + 27, qrY - 4, {
    align: "center",
  });

  /* ------------------------------------------------------------
      FOOTER
  ------------------------------------------------------------- */
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);

    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: "right" }
    );

    doc.setFont("Helvetica", "bold");
    doc.text(
      "Thank you for shopping with PR Stationers!",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  /* ------------------------------------------------------------
      RETURN BLOB (FOR WHATSAPP / STORAGE)
  ------------------------------------------------------------- */
  if (asBlob) {
    return doc.output("blob");
  }

  /* ------------------------------------------------------------
      DOWNLOAD PDF (ADMIN)
  ------------------------------------------------------------- */
  doc.save(`Invoice_${order.orderId}.pdf`);
};
