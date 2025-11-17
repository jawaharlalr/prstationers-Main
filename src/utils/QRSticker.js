// QRSticker.js (FINAL — Two QR + Product QR opens PDF page)
import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

/* ------------------------------------------------------------
   UPI QR LOGIC
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

export default function QRSticker({ order, onClose }) {
  const [upiQR, setUpiQR] = useState(null);

  // ⭐ PRODUCT QR NOW OPENS PDF PAGE
  const productQR = `https://prstationers.vercel.app/products-view/${order.id}`;


  useEffect(() => {
    const upiString = generateUPIString(order.totalPrice);
    generateQR(upiString).then((src) => setUpiQR(src));
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
          {/* ================= CUSTOMER SECTION ================= */}
          <p><strong>Cus Name:</strong> {order.userName}</p>
          <p><strong>Ph No:</strong> {order.userPhone}</p>
          <p><strong>Order ID:</strong> {order.orderId}</p>

          {/* ================= QR SECTION ================= */}
          <div className="flex justify-between mt-3">
            {/* PAYMENT QR */}
            <div className="w-1/2 pr-2 text-center border-r">
              <p className="mb-1 font-semibold">Scan to Pay</p>
              {upiQR && (
                <img src={upiQR} alt="UPI QR" className="mx-auto w-[140px] h-[140px]" />
              )}
              <p className="mt-1 font-semibold">₹{order.totalPrice}</p>
            </div>

            {/* PRODUCT QR → Opens PDF */}
            <div className="w-1/2 pl-2 text-center">
              <p className="mb-1 font-semibold">Scan to View Products</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  productQR
                )}`}
                alt="Products QR"
                className="mx-auto w-[140px] h-[140px]"
              />
            </div>
          </div>

          {/* ================= FOOTER ================= */}
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
