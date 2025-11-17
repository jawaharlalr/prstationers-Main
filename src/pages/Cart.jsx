import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

// UNIVERSAL COLOR LIST (HEX)
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

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart: clearCartContext, setCart } = useCart();

  const cartItems = Object.values(cart).filter(Boolean);

  const totalItems = cartItems.length;
  const totalQty = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  const [deliveryType, setDeliveryType] = useState("");

  // Load saved delivery type
  useEffect(() => {
    const savedType = cartItems.find((item) => item.deliveryType)?.deliveryType;
    if (savedType) setDeliveryType(savedType);
  }, [cartItems]);

  // Auto-save cart
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Get HEX color
  const getColorHex = (colorName) => {
    const c = allColors.find((x) => x.name === colorName);
    return c?.hex || "#ccc";
  };

  // SAVE delivery type
  const saveDeliveryType = async (type) => {
    const user = auth.currentUser;
    if (!user) return toast.error("Please login to save delivery type.");

    try {
      const updatedCart = {};

      for (const id in cart) {
        if (!cart[id]) continue;

        const item = cart[id];

        updatedCart[id] = {
          productId: item.productId || item.id || "",
          name: item.name || "",
          price: item.price || 0,
          image: item.image ?? "",
          category: item.category || "",
          selectedOptions: item.selectedOptions || {},
          quantity: item.quantity || 1,
          deliveryType: type,
          addedAt: new Date(),
        };

        await setDoc(doc(db, "users", user.uid, "cart", id), updatedCart[id]);
      }

      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      setDeliveryType(type);
      toast.success("Delivery type saved!");
    } catch (err) {
      console.error("Save delivery error:", err);
      toast.error("Failed to save delivery type.");
    }
  };

  const handleCheckout = () => {
    if (!deliveryType) {
      toast.error("Please select a delivery type first!");
      return;
    }
    navigate("/checkout");
  };

  const handleClearCart = () => {
    clearCartContext();
    localStorage.removeItem("cart");
  };

  // Empty Cart
  if (!cartItems.length) {
    return (
      <div className="px-4 py-10 mx-auto text-center text-gray-600 max-w-7xl">
        Your cart is empty.
      </div>
    );
  }

  return (
    <div className="px-4 py-10 mx-auto max-w-7xl pb-36">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">My Cart</h1>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full bg-white border-collapse shadow-md rounded-xl">
          <thead className="text-sm text-gray-700 bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Color</th>
              <th className="px-4 py-3 text-left">Size</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-center">Price</th>
              <th className="px-4 py-3 text-center">Total</th>
              <th className="px-4 py-3 text-center">Delivery</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {cartItems.map((item, i) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>

                <td
                  className="px-4 py-3 text-blue-600 cursor-pointer whitespace-nowrap"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  {item.name}
                </td>

                <td className="px-4 py-3 capitalize">{item.category}</td>

                <td className="px-4 py-3">
                  {item.selectedOptions?.color ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-4 h-4 border rounded-full"
                        style={{
                          backgroundColor: getColorHex(item.selectedOptions.color),
                        }}
                      ></span>
                      {item.selectedOptions.color}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="px-4 py-3">{item.selectedOptions?.size || "-"}</td>

                <td className="px-4 py-3 text-center">{item.quantity || 1}</td>
                <td className="px-4 py-3 text-center">₹{item.price}</td>
                <td className="px-4 py-3 text-center">
                  ₹{item.price * (item.quantity || 1)}
                </td>

                <td className="px-4 py-3 text-center">
                  {item.deliveryType || "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-4 md:hidden">
        {cartItems.map((item, i) => (
          <div key={item.id} className="p-4 bg-white shadow-md rounded-xl">
            <div className="flex justify-between">
              <h2
                className="text-lg font-medium cursor-pointer"
                onClick={() => navigate(`/product/${item.id}`)}
              >
                {i + 1}. {item.name}
              </h2>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-sm text-red-500"
              >
                Remove
              </button>
            </div>

            <div className="flex flex-col gap-1 text-sm text-gray-700">
              <p>Category: {item.category}</p>
              <p>
                Color:{" "}
                {item.selectedOptions?.color ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-4 h-4 border rounded-full"
                      style={{
                        backgroundColor: getColorHex(item.selectedOptions.color),
                      }}
                    />
                    {item.selectedOptions.color}
                  </span>
                ) : (
                  "-"
                )}
              </p>

              <p>Size: {item.selectedOptions?.size || "-"}</p>
              <p>Qty: {item.quantity || 1}</p>
              <p>Price: ₹{item.price}</p>
              <p>Total: ₹{item.price * (item.quantity || 1)}</p>
              <p>Delivery: {item.deliveryType || "-"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Type */}
      <div className="p-4 mt-6 bg-white shadow-md rounded-xl">
        <span className="font-medium text-gray-700">Delivery Type:</span>
        <div className="flex gap-4 mt-3">
          {["Home Delivery", "Store Pickup"].map((type) => (
            <button
              key={type}
              onClick={() => saveDeliveryType(type)}
              className={`px-4 py-2 rounded-full border ${
                deliveryType === type
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-between p-4 mt-6 text-sm bg-white shadow-md rounded-xl">
        <span>
          Total Items: {totalItems} | Total Qty: {totalQty}
        </span>
        <span className="font-bold text-green-600">
          Total Price: ₹{totalPrice}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={handleClearCart}
          className="px-4 py-2 text-white bg-red-500 rounded-full hover:bg-red-600"
        >
          Clear Cart
        </button>

        <button
          onClick={handleCheckout}
          className="px-4 py-2 text-white bg-green-600 rounded-full hover:bg-green-700"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
