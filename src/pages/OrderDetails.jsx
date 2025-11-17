import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { FiUser, FiPhone } from "react-icons/fi";

// UNIVERSAL COLOR LIST WITH HEX
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

export default function OrderDetails() {
  const { id } = useParams(); // orderId from URL
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status steps
  const steps = ["Pending", "Processing", "Shipped", "Delivered"];

  useEffect(() => {
    const fetchOrder = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const orderRef = doc(db, "users", user.uid, "orders", id);
        const snap = await getDoc(orderRef);

        if (snap.exists()) {
          setOrder(snap.data());
        } else {
          toast.error("Order not found.");
          navigate("/orders");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch order details.");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  if (loading)
    return <p className="mt-20 text-center text-gray-600">Loading order...</p>;

  if (!order)
    return (
      <div className="px-4 py-10 mx-auto text-center text-gray-600 max-w-7xl">
        Order not found.
      </div>
    );

  const currentStep = steps.indexOf(order.status);

  return (
    <div className="max-w-5xl px-4 py-10 mx-auto">
      {/* Back */}
      <div className="flex flex-col items-start justify-between mb-6 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Order Details:{" "}
          <span className="font-mono text-blue-600">{order.orderId}</span>
        </h1>

        <button
          onClick={() => navigate("/orders")}
          className="px-4 py-2 mt-3 text-sm text-white bg-blue-600 rounded-full hover:bg-blue-700 md:mt-0"
        >
          ← Back to My Orders
        </button>
      </div>

      {/* Customer Info */}
      <div className="p-4 mb-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Customer Info
        </h2>

        <div className="flex flex-col gap-1 text-gray-700 md:flex-row md:gap-6">
          <p className="flex items-center gap-2">
            <FiUser className="text-gray-500" />
            <strong>{order.userName}</strong>
          </p>

          <p className="flex items-center gap-2">
            <FiPhone className="text-gray-500" />
            {order.userPhone}
          </p>
        </div>
      </div>

      {/* Status Tracker */}
      <div className="p-4 mb-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Order Status
        </h2>

        <div className="relative flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-sm">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-1 ${
                  index <= currentStep
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {index + 1}
              </div>

              <span
                className={`${
                  index <= currentStep
                    ? "text-green-700 font-medium"
                    : "text-gray-500"
                }`}
              >
                {step}
              </span>

              {index < steps.length - 1 && (
                <div
                  className={`absolute h-1 top-3 left-0 right-0 z-[-1] ${
                    index < currentStep ? "bg-green-600" : "bg-gray-200"
                  }`}
                  style={{
                    width: `${(index + 1) * (100 / (steps.length - 1))}%`,
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 mb-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Order Summary
        </h2>

        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`font-semibold ${
                order.status === "Pending"
                  ? "text-yellow-600"
                  : order.status === "Delivered"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            >
              {order.status}
            </span>
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {order.createdAt?.toDate
              ? new Date(order.createdAt.toDate()).toLocaleString()
              : "—"}
          </p>

          <p>
            <strong>Delivery Type:</strong> {order.deliveryType || "—"}
          </p>

          <p>
            <strong>Total Items:</strong> {order.totalItems}
          </p>

          <p>
            <strong>Total Quantity:</strong> {order.totalQty}
          </p>

          <p>
            <strong>Total Price:</strong>{" "}
            <span className="font-semibold text-green-600">
              ₹{order.totalPrice}
            </span>
          </p>
        </div>

        <div className="mt-3">
          <strong>Delivery Address:</strong>
          <p className="mt-1 text-gray-700">{order.address}</p>
        </div>
      </div>

      {/* Ordered Items */}
      <div className="p-4 bg-white shadow-md rounded-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Ordered Items
        </h2>

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
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{item.name}</td>

                  {/* Color */}
                  <td className="p-2">
                    {item.selectedOptions?.color ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 border rounded-full"
                          style={{
                            backgroundColor: getColorHex(
                              item.selectedOptions.color
                            ),
                            borderColor:
                              item.selectedOptions.color === "White"
                                ? "#ccc"
                                : "transparent",
                          }}
                        />
                        {item.selectedOptions.color}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Size */}
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
      </div>
    </div>
  );
}
