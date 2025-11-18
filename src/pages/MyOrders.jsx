// Updated MyOrders component — fully fixed and defensive
// With updated status handling based on delivery type

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { FiChevronDown, FiChevronUp, FiUser, FiPhone } from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { generateInvoicePDF } from "../utils/generateInvoicePDF";

const allColors = [
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Grey", hex: "#808080" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Maroon", hex: "#800000" },
  { name: "Navy", hex: "#000080" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Olive", hex: "#808000" },
];

const getColorHex = (name) => allColors.find((c) => c.name === name)?.hex || "#ccc";

function formatDate(value) {
  if (!value) return "—";
  try {
    if (typeof value === "object" && typeof value.toDate === "function") {
      return new Date(value.toDate()).toLocaleString();
    }
    if (typeof value === "number") return new Date(value).toLocaleString();
    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed.toLocaleString();
    return "—";
  } catch {
    return "—";
  }
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Failed to load orders");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDownloadInvoice = async (order) => {
    try {
      const pdfBlob = await generateInvoicePDF(order, true);
      const url = URL.createObjectURL(pdfBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${order.orderId || "order"}.pdf`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }, 1500);

      toast.success("Download started");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download invoice");
    }
  };

  if (loading)
    return <p className="mt-20 text-center text-gray-600">Loading orders...</p>;

  if (!orders || orders.length === 0)
    return (
      <div className="px-4 py-10 mx-auto text-center text-gray-600">
        You haven’t placed any orders yet.
      </div>
    );

  return (
    <div className="max-w-5xl px-4 py-10 mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 mb-4 text-sm text-gray-800 bg-gray-200 rounded-full hover:bg-gray-300"
      >
        ← Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-800">My Orders</h1>

      <div className="flex flex-col gap-6">
        {orders.map((order, index) => {
          const isExpanded = expandedOrder === order.id;
          const items = Array.isArray(order.items) ? order.items : [];
          const totalItems = items.length;
          const totalQty = items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);

          const canDownload =
            order.status === "Delivered" || order.status === "Picked Up";

          return (
            <div key={order.id || index} className="p-4 bg-white shadow-md rounded-xl">
              <div
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">S.No: {index + 1}</span>
                  <span className="font-semibold text-gray-800">{order.orderId || "—"}</span>
                  <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                </div>

                <button
                  type="button"
                  aria-expanded={isExpanded}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {isExpanded ? <FiChevronUp className="text-xl" /> : <FiChevronDown className="text-xl" />}
                </button>
              </div>

              {isExpanded && (
                <div className="pt-3 mt-4 border-t border-gray-200">
                  <div className="flex flex-col gap-1 mb-3 text-sm text-gray-700 md:flex-row md:gap-6">
                    <p className="flex items-center gap-2"><FiUser /> {order.userName || "—"}</p>
                    <p className="flex items-center gap-2"><FiPhone /> {order.userPhone || "—"}</p>
                  </div>

                  <p className="mb-3 text-sm text-gray-700">
                    <strong>Total Items:</strong> {totalItems} &nbsp;|&nbsp; <strong>Total Qty:</strong> {totalQty}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-center border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2">S.No</th>
                          <th className="p-2">Product</th>
                          <th className="p-2">Color</th>
                          <th className="p-2">Size</th>
                          <th className="p-2">Qty</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item, i) => (
                          <tr key={item.id || i} className="border-t">
                            <td className="p-2 text-center">{i + 1}</td>
                            <td className="p-2 text-center">{item.name || "—"}</td>
                            <td className="p-2 text-center">
                              {item.selectedOptions?.color ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span
                                    className="inline-block w-5 h-5 border rounded-full"
                                    style={{ backgroundColor: getColorHex(item.selectedOptions.color) }}
                                  ></span>
                                  {item.selectedOptions.color}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-2 text-center">{item.selectedOptions?.size || "-"}</td>
                            <td className="p-2 text-center">{item.quantity ?? 0}</td>
                            <td className="p-2 text-center">₹{item.price ?? 0}</td>
                            <td className="p-2 text-center">₹{(Number(item.price) || 0) * (Number(item.quantity) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ✔ NEW — Updated status text based on delivery type */}
                  <div className="flex flex-col justify-between gap-2 mt-4 text-sm text-gray-700 md:flex-row">
                    <p><strong>Delivery:</strong> {order.deliveryType || "—"}</p>
                    <p><strong>Total:</strong> <span className="font-semibold text-green-600">₹{order.totalPrice ?? 0}</span></p>
                    <p><strong>Status:</strong> {order.status || "—"}</p>
                  </div>

                  {/* ✔ NEW — Invoice available only for Delivered / Picked Up */}
                  {canDownload && (
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(order)}
                        className="px-4 py-1 text-sm text-white bg-purple-600 rounded-full hover:bg-purple-700"
                      >
                        Download Bill
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
