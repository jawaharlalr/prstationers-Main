// ProductsView.jsx
// A page that shows order products in a clean table BEFORE PDF generation.
// URL Example: https://prstationers.vercel.app/products-view/ORDER_ID

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ProductsView() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      const ref = doc(db, "orders", orderId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setOrder(snap.data());
      }

      setLoading(false);
    }

    loadOrder();
  }, [orderId]);

  const downloadPDF = () => {
    if (!order) return;

    const docPdf = new jsPDF();

    docPdf.setFontSize(18);
    docPdf.text("Product Details", 14, 15);

    docPdf.setFontSize(12);
    docPdf.text(`Order ID: ${order.orderId}`, 14, 30);
    docPdf.text(`Customer: ${order.userName}`, 14, 38);
    docPdf.text(`Phone: ${order.userPhone}`, 14, 46);

    autoTable(docPdf, {
      startY: 60,
      head: [["Product", "Color", "Size", "Qty", "Price", "Total"]],
      body: order.items.map((item) => [
        item.name,
        item.selectedOptions?.color || "-",
        item.selectedOptions?.size || "-",
        item.quantity,
        "₹" + item.price,
        "₹" + item.price * item.quantity,
      ]),
    });

    docPdf.save(`Products_${order.orderId}.pdf`);
  };

  if (loading) return <div className="p-10 text-lg text-center">Loading...</div>;

  if (!order)
    return <div className="p-10 text-lg text-center text-red-600">Order Not Found</div>;

  return (
    <div className="max-w-2xl p-6 mx-auto">
      <h1 className="mb-4 text-2xl font-bold text-center">Products Preview</h1>

      <div className="p-4 mb-4 bg-gray-100 rounded">
        <p><strong>Order ID:</strong> {order.orderId}</p>
        <p><strong>Customer:</strong> {order.userName}</p>
        <p><strong>Phone:</strong> {order.userPhone}</p>
        <p><strong>Address:</strong> {order.address}</p>
      </div>

      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">Product</th>
            <th className="p-2 border">Color</th>
            <th className="p-2 border">Size</th>
            <th className="p-2 border">Qty</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>

        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} className="border-t">
              <td className="p-2 border">{item.name}</td>
              <td className="p-2 border">{item.selectedOptions?.color || "-"}</td>
              <td className="p-2 border">{item.selectedOptions?.size || "-"}</td>
              <td className="p-2 text-center border">{item.quantity}</td>
              <td className="p-2 border">₹{item.price}</td>
              <td className="p-2 border">₹{item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-right">
        <button
          onClick={downloadPDF}
          className="px-4 py-2 text-white bg-green-600 rounded shadow"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
