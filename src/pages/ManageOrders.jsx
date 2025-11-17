import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { FiTrash2, FiX, FiUser, FiPhone } from "react-icons/fi";
import toast from "react-hot-toast";

import { generateInvoicePDF } from "../utils/generateInvoicePDF";
import QRSticker from "../utils/QRSticker";

/* ============================================================
   UNIVERSAL COLOR HELPER
============================================================ */
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

const getColorHex = (colorName) =>
  allColors.find((x) => x.name === colorName)?.hex || "#ccc";

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [qrOrder, setQrOrder] = useState(null);
  const [showQR, setShowQR] = useState(false);

  /* ============================================================
     REAL-TIME ORDER LISTENER
  ============================================================ */
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(list);
    });

    return () => unsubscribe();
  }, []);

  /* ============================================================
     ENABLE INVOICE ACCESS FOR USER
  ============================================================ */
  const saveInvoiceForUser = async (order) => {
    try {
      toast.loading("Enabling invoice...", { id: "inv" });

      await Promise.all([
        updateDoc(doc(db, "orders", order.id), { invoiceAvailable: true }),
        updateDoc(doc(db, "users", order.userId, "orders", order.id), {
          invoiceAvailable: true,
        }),
      ]);

      toast.remove("inv");
      toast.success("Invoice enabled for user!");
    } catch (err) {
      toast.remove("inv");
      toast.error("Failed to enable invoice");
    }
  };

  /* ============================================================
     UPDATE ORDER STATUS
  ============================================================ */
  const handleStatusChange = async (orderId, userId, newStatus) => {
    try {
      await Promise.all([
        updateDoc(doc(db, "orders", orderId), { status: newStatus }),
        updateDoc(doc(db, "users", userId, "orders", orderId), {
          status: newStatus,
        }),
      ]);

      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  /* ============================================================
     DELETE ORDER
  ============================================================ */
  const handleDelete = async (orderId, userId) => {
    if (!window.confirm("Delete this order?")) return;

    try {
      await Promise.all([
        deleteDoc(doc(db, "orders", orderId)),
        deleteDoc(doc(db, "users", userId, "orders", orderId)),
      ]);

      toast.success("Order deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  /* ============================================================
     UI RENDER
  ============================================================ */
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Manage Orders</h1>

      <div className="p-6 overflow-x-auto bg-white shadow rounded-xl">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">S.No</th>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order, i) => (
              <tr key={order.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{i + 1}</td>
                <td className="p-3 font-mono text-blue-600">{order.orderId}</td>
                <td className="p-3">{order.userName}</td>
                <td className="p-3">{order.userPhone}</td>

                <td className="p-3 font-semibold text-green-600">
                  ₹{order.totalPrice}
                </td>

                <td className="p-3">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, order.userId, e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  >
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                  </select>
                </td>

                <td className="flex items-center gap-3 p-3">

                  {/* PDF BUTTON */}
                  <button
                    onClick={() => generateInvoicePDF(order)}
                    className="px-3 py-1 text-sm text-white bg-purple-600 rounded-full hover:bg-purple-700"
                  >
                    PDF
                  </button>

                  {/* ENABLE INVOICE */}
                  <button
                    onClick={() => saveInvoiceForUser(order)}
                    className="px-3 py-1 text-sm text-white bg-green-600 rounded-full hover:bg-green-700"
                  >
                    Enable Invoice
                  </button>

                  {/* VIEW ORDER */}
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowModal(true);
                    }}
                    className="px-3 py-1 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700"
                  >
                    View
                  </button>

                  {/* QR BUTTON */}
                  <button
                    onClick={() => {
                      setQrOrder(order);
                      setShowQR(true);
                    }}
                    className="px-3 py-1 text-sm text-white bg-orange-500 rounded-full hover:bg-orange-600"
                  >
                    QR
                  </button>

                  {/* DELETE */}
                  <FiTrash2
                    size={20}
                    className="text-red-500 cursor-pointer hover:text-red-700"
                    onClick={() => handleDelete(order.id, order.userId)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ORDER DETAILS MODAL */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-w-2xl bg-white p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute text-gray-500 right-4 top-4 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>

            <h2 className="mb-4 text-xl font-bold">
              Order Details —{" "}
              <span className="text-blue-600">{selectedOrder.orderId}</span>
            </h2>

            {/* USER INFO */}
            <div className="p-4 bg-gray-100 rounded">
              <p className="flex items-center gap-2">
                <FiUser /> <strong>{selectedOrder.userName}</strong>
              </p>
              <p className="flex items-center gap-2 mt-1">
                <FiPhone /> {selectedOrder.userPhone}
              </p>
            </div>

            {/* ORDER SUMMARY */}
            <table className="w-full mt-4 text-sm">
              <tbody>
                <tr><td>Status:</td><td>{selectedOrder.status}</td></tr>
                <tr><td>Total Items:</td><td>{selectedOrder.totalItems}</td></tr>
                <tr><td>Total Qty:</td><td>{selectedOrder.totalQty}</td></tr>
                <tr>
                  <td>Total Price:</td>
                  <td className="font-bold text-green-600">
                    ₹{selectedOrder.totalPrice}
                  </td>
                </tr>
                <tr><td>Address:</td><td>{selectedOrder.address}</td></tr>
              </tbody>
            </table>

            {/* ITEMS TABLE */}
            <h3 className="mt-4 text-lg font-semibold">Items</h3>

            <table className="w-full mt-2 text-sm border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th>S.No</th>
                  <th>Product</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {selectedOrder.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td>{i + 1}</td>
                    <td>{item.name}</td>

                    <td>
                      {item.selectedOptions?.color ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-4 h-4 border rounded-full"
                            style={{
                              backgroundColor: getColorHex(
                                item.selectedOptions.color
                              ),
                            }}
                          ></span>
                          {item.selectedOptions.color}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{item.selectedOptions?.size || "-"}</td>

                    <td>{item.quantity}</td>
                    <td>₹{item.price}</td>
                    <td>₹{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-white bg-blue-600 rounded-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQR && qrOrder && (
        <QRSticker order={qrOrder} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}
