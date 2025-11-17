// QRSticker.js — FINAL VERSION (PDF → Firebase → QR)
import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/* ------------------------------------------------------------
   UPI QR
------------------------------------------------------------ */
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
    img.onload = () => resolve(img.src);
  });
}

/* ------------------------------------------------------------
   PDF GENERATOR (Updated with Table + Summary)
------------------------------------------------------------ */
function generateOrderPDF(order) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  /* ---------------- HEADER ---------------- */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PR STATIONERS - PRODUCT LIST", pageWidth / 2, 14, {
    align: "center",
  });

  doc.setFontSize(11);
  doc.setFont("Helvetica", "normal");
  doc.text(`Order ID: ${order.orderId}`, 14, 28);
  doc.text(`Customer: ${order.userName}`, 14, 36);
  doc.text(`Phone: ${order.userPhone}`, 14, 44);

  /* ---------------- TABLE DATA ---------------- */
  const tableRows = order.items.map((item, i) => [
    i + 1,
    item.name,
    item.quantity,
    "Rs. " + item.price,
    "Rs. " + (item.price * item.quantity),
  ]);

  autoTable(doc, {
    startY: 55,
    head: [["S.no", "Product", "Qty", "Price", "Total"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: 255,
      fontSize: 12,
    },
    styles: {
      fontSize: 11,
      cellPadding: 3,
    },
    margin: { left: 14, right: 14 },
  });

  /* ---------------- SUMMARY ---------------- */
  const finalY = doc.lastAutoTable.finalY + 12;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Summary", 14, finalY);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);

  doc.text(`Total Items: ${order.items.length}`, 14, finalY + 10);
  doc.text(
    `Total Qty: ${order.items.reduce((sum, i) => sum + i.quantity, 0)}`,
    14,
    finalY + 18
  );

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Total Amount: Rs. ${order.totalPrice}`, 14, finalY + 32);

  /* ---------------- RETURN BLOB ---------------- */
  return doc.output("blob");
}


/* ------------------------------------------------------------
   UPLOAD PDF TO FIREBASE
------------------------------------------------------------ */
async function uploadPDFtoFirebase(blob, orderId) {
  const fileRef = ref(storage, `order-pdfs/${orderId}.pdf`);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
}

/* ------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------ */
export default function QRSticker({ order, onClose }) {
  const [upiQR, setUpiQR] = useState(null);
  const [pdfURL, setPdfURL] = useState(null);

  useEffect(() => {
    // 1️⃣ Generate UPI QR
    const upiString = generateUPIString(order.totalPrice);
    generateQR(upiString).then((src) => setUpiQR(src));

    // 2️⃣ Generate PDF → Upload → Get Public URL
    async function createPDF() {
      const pdfBlob = generateOrderPDF(order);
      const url = await uploadPDFtoFirebase(pdfBlob, order.id);
      setPdfURL(url);
    }

    createPDF();
  }, [order]);

  const printSticker = () => {
    const content = document.getElementById("qrPrintArea").innerHTML;
    const Win = window.open("", "", "width=400,height=600");
    Win.document.write(content);
    Win.document.close();
    Win.focus();
    Win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-[95%] max-w-md p-5 rounded-lg relative">
        <button
          onClick={onClose}
          className="absolute text-gray-600 right-3 top-3 hover:text-black"
        >
          <FiX size={22} />
        </button>

        <h2 className="mb-3 text-lg font-bold text-center">QR Stickers</h2>

        <div id="qrPrintArea" className="p-3 border rounded-lg text-[14px]">
          <p><strong>Cus Name:</strong> {order.userName}</p>
          <p><strong>Ph No:</strong> {order.userPhone}</p>
          <p><strong>Order ID:</strong> {order.orderId}</p>

          <div className="flex justify-between mt-3">
            {/* PAYMENT QR */}
            <div className="w-1/2 pr-2 text-center border-r">
              <p className="mb-1 font-semibold">Scan to Pay</p>
              {upiQR && (
                <img src={upiQR} alt="UPI QR" className="mx-auto w-[140px] h-[140px]" />
              )}
              <p className="mt-1 font-semibold">₹{order.totalPrice}</p>
            </div>

            {/* PRODUCT PDF QR */}
            <div className="w-1/2 pl-2 text-center">
              <p className="mb-1 font-semibold">Scan to View PDF</p>

              {pdfURL && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                    pdfURL
                  )}`}
                  alt="Product PDF QR"
                  className="mx-auto w-[140px] h-[140px]"
                />
              )}
            </div>
          </div>

          <p className="mt-3 font-medium text-left">
            Thank you for shopping with PR Stationers
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={printSticker}
            className="px-4 py-1 text-white bg-green-600 rounded"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
