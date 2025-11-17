import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  doc,
} from "firebase/firestore";
import { FiChevronDown, FiChevronUp, FiUser, FiPhone } from "react-icons/fi";
import toast from "react-hot-toast";
import OrderDetailsModal from "../pages/OrderDetails";
import { useNavigate } from "react-router-dom";
import { generateInvoicePDF } from "../utils/generateInvoicePDF";

/* ============================================================
   COLOR HELPER
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

const getColorHex = (name) =>
  allColors.find((c) => c.name === name)?.hex || "#ccc";

/* ============================================================
   PAGE COMPONENT
============================================================ */
export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Order modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Invoice modal
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceBlobUrl, setInvoiceBlobUrl] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const navigate = useNavigate();

  /* ============================================================
     REAL-TIME ORDER FETCH
  ============================================================ */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

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

  /* ============================================================
     RE-ORDER
  ============================================================ */
  const handleReOrder = async (order) => {
    const user = auth.currentUser;
    if (!user) return toast.error("Please login!");

    const confirmReorder = window.confirm("Re-order these items?");
    if (!confirmReorder) return;

    try {
      for (const item of order.items) {
        const cartId = `${item.id}_${Date.now()}`;

        await setDoc(doc(db, "users", user.uid, "cart", cartId), {
          productId: item.id || "",
          name: item.name || "",
          price: item.price || 0,
          image: item.image ?? "",
          category: item.category || "",
          selectedOptions: item.selectedOptions || {},
          quantity: item.quantity || 1,
          addedAt: new Date(),
        });
      }

      toast.success("Items added to cart");
      navigate("/cart");
    } catch (err) {
      console.error(err);
      toast.error("Re-order failed");
    }
  };

  /* ============================================================
     VIEW INVOICE
  ============================================================ */
  const handleViewInvoice = async (order) => {
    try {
      setInvoiceLoading(true);
      setSelectedInvoice(order);

      const pdfBlob = await generateInvoicePDF(order, true);
      const blobUrl = URL.createObjectURL(pdfBlob);

      setInvoiceBlobUrl(blobUrl);
      setInvoiceModal(true);
      setInvoiceLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Invoice failed to load");
      setInvoiceLoading(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */
  if (loading)
    return <p className="mt-20 text-center text-gray-600">Loading orders...</p>;

  if (!orders.length)
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

          return (
            <div key={order.id} className="p-4 bg-white shadow-md rounded-xl">
              {/* HEADER */}
              <div
                onClick={() =>
                  setExpandedOrder(isExpanded ? null : order.id)
                }
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">S.No: {index + 1}</span>
                  <span className="font-semibold text-gray-800">
                    {order.orderId}
                  </span>
                  <span className="text-sm text-gray-500">
                    {order.createdAt?.toDate
                      ? new Date(order.createdAt.toDate()).toLocaleString()
                      : "—"}
                  </span>
                </div>

                <button className="text-gray-600 hover:text-gray-800">
                  {isExpanded ? (
                    <FiChevronUp className="text-xl" />
                  ) : (
                    <FiChevronDown className="text-xl" />
                  )}
                </button>
              </div>

              {/* EXPANDED */}
              {isExpanded && (
                <div className="pt-3 mt-4 border-t border-gray-200">
                  {/* USER INFO */}
                  <div className="flex flex-col gap-1 mb-3 text-sm text-gray-700 md:flex-row md:gap-6">
                    <p className="flex items-center gap-2">
                      <FiUser /> {order.userName}
                    </p>
                    <p className="flex items-center gap-2">
                      <FiPhone /> {order.userPhone}
                    </p>
                  </div>

                  {/* ITEMS TABLE */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200 rounded-lg">
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
                        {order.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2">{item.name}</td>

                            <td className="p-2">
                              {item.selectedOptions?.color ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block w-5 h-5 border rounded-full"
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

                            <td className="p-2">
                              {item.selectedOptions?.size || "-"}
                            </td>

                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">₹{item.price}</td>
                            <td className="p-2">
                              ₹{item.price * item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* FOOTER */}
                  <div className="flex flex-col justify-between gap-2 mt-4 text-sm text-gray-700 md:flex-row">
                    <p>
                      <strong>Delivery:</strong> {order.deliveryType}
                    </p>
                    <p>
                      <strong>Total:</strong>{" "}
                      <span className="font-semibold text-green-600">
                        ₹{order.totalPrice}
                      </span>
                    </p>
                    <p>
                      <strong>Status:</strong> {order.status}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end gap-3 mt-4">
                    {order.status === "Delivered" && (
                      <button
                        onClick={() => handleReOrder(order)}
                        className="px-4 py-1 text-sm text-white bg-green-600 rounded-full hover:bg-green-700"
                      >
                        Re-Order
                      </button>
                    )}

                    {order.invoiceAvailable && (
                      <button
                        onClick={() => handleViewInvoice(order)}
                        className="px-4 py-1 text-sm text-white bg-purple-600 rounded-full hover:bg-purple-700"
                      >
                        View Invoice
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setShowOrderModal(true);
                      }}
                      className="px-4 py-1 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ORDER DETAILS MODAL */}
      {showOrderModal && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* INVOICE MODAL */}
      {invoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[90%] max-w-3xl bg-white rounded-lg shadow-lg p-4 relative">
            <button
              onClick={() => {
                setInvoiceModal(false);
                URL.revokeObjectURL(invoiceBlobUrl);
              }}
              className="absolute text-gray-500 top-3 right-3 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="mb-3 text-lg font-semibold">Invoice</h2>

            {invoiceLoading ? (
              <p className="py-10 text-center">Loading invoice...</p>
            ) : (
              <>
                <iframe
                  src={invoiceBlobUrl}
                  className="w-full h-[500px] border rounded"
                  title="Invoice PDF"
                ></iframe>

                <div className="flex justify-end mt-4">
                  <a
                    href={invoiceBlobUrl}
                    download={`Invoice_${selectedInvoice?.orderId}.pdf`}
                    className="px-4 py-2 text-white bg-green-600 rounded-full hover:bg-green-700"
                  >
                    Download Invoice
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
