import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { useCart } from "../context/CartContext";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import toast from "react-hot-toast";

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

const getColorHex = (colorName) =>
  allColors.find((x) => x.name === colorName)?.hex || "#ccc";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [showModal, setShowModal] = useState(false);

  const cartItems = Object.values(cart).filter(Boolean);
  const totalQty = cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const totalPrice = cartItems.reduce(
    (sum, i) => sum + i.price * (i.quantity || 1),
    0
  );
  const deliveryType = cartItems[0]?.deliveryType || "";

  // Fetch user info + addresses
  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserName(data.displayName || user.displayName || "");
          setUserPhone(data.phone || "");
        }

        const addrSnap = await getDocs(
          collection(db, "users", user.uid, "addresses")
        );
        setAddresses(addrSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load user info.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // Add new address
  const handleAddAddress = async () => {
    if (!newAddress.trim()) return toast.error("Enter an address.");
    const user = auth.currentUser;

    try {
      const docRef = await addDoc(
        collection(db, "users", user.uid, "addresses"),
        { address: newAddress }
      );

      const newAddrObj = { id: docRef.id, address: newAddress };
      setAddresses((prev) => [...prev, newAddrObj]);
      setSelectedAddress(newAddress);
      setNewAddress("");
      setShowAddAddress(false);
      toast.success("Address added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add address.");
    }
  };

  // Create Order ID
  const generateOrderId = async (uid, phone) => {
    const ph = phone || "0000000000";
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const ordersRef = collection(db, "users", uid, "orders");
    const q = query(ordersRef, orderBy("createdAt"));
    const snap = await getDocs(q);
    const count = String(snap.size + 1).padStart(4, "0");

    return `PR-${ph}-${dd}${mm}-${count}`;
  };

  // Confirm Order
  const handleConfirmOrder = async () => {
    const user = auth.currentUser;
    if (!user) return toast.error("Please login.");
    if (!selectedAddress) return toast.error("Select an address.");

    try {
      const customId = await generateOrderId(user.uid, userPhone);

      const orderData = {
        orderId: customId,
        items: cartItems,
        totalItems: cartItems.length,
        totalQty,
        totalPrice,
        deliveryType,
        address: selectedAddress,
        userId: user.uid,
        userName,
        userPhone,
        createdAt: serverTimestamp(),
        status: "Pending",
      };

      await setDoc(doc(db, "users", user.uid, "orders", customId), orderData);
      await setDoc(doc(db, "orders", customId), orderData);

      clearCart();
      localStorage.removeItem("cart");

      setOrderId(customId);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order.");
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate("/orders");
  };

  if (loading) return <p className="mt-20 text-center">Loading checkout...</p>;

  if (!cartItems.length)
    return (
      <div className="px-4 py-10 text-center text-gray-600">
        Your cart is empty.
      </div>
    );

  return (
    <div className="max-w-5xl px-4 py-10 pb-24 mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Checkout</h1>

      {/* USER INFO */}
      <div className="p-4 mb-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">Your Info</h2>
        <p><strong>Name:</strong> {userName || "Not set"}</p>
        <p><strong>Phone:</strong> {userPhone || "Not set"}</p>
      </div>

      {/* ADDRESS */}
      <div className="p-4 mb-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Select Delivery Address
        </h2>

        {addresses.length > 0 ? (
          <div className="flex flex-col gap-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${
                  selectedAddress === a.address
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={a.address}
                  checked={selectedAddress === a.address}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                />
                {a.address}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No saved addresses.</p>
        )}

        {!showAddAddress ? (
          <button
            onClick={() => setShowAddAddress(true)}
            className="px-3 py-2 mt-4 text-sm text-white bg-blue-600 rounded"
          >
            + Add New Address
          </button>
        ) : (
          <div className="flex flex-col gap-2 mt-4">
            <textarea
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter new address"
              rows="3"
            />

            <div className="flex gap-2">
              <button
                onClick={handleAddAddress}
                className="px-4 py-2 text-white bg-green-600 rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddAddress(false);
                  setNewAddress("");
                }}
                className="px-4 py-2 text-gray-800 bg-gray-200 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ORDER SUMMARY */}
      <div className="p-4 mb-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Order Summary
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">S.No</th>
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Color</th>
                <th className="p-2 text-left">Size</th>
                <th className="p-2 text-left">Qty</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Total</th>
              </tr>
            </thead>

            <tbody>
              {cartItems.map((item, i) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{item.name}</td>

                  {/* COLOR PREVIEW */}
                  <td className="p-2">
                    {item.selectedOptions?.color ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-5 h-5 border rounded-full"
                          style={{
                            backgroundColor: getColorHex(
                              item.selectedOptions.color
                            ),
                            borderColor:
                              item.selectedOptions.color === "White"
                                ? "#ccc"
                                : "transparent",
                          }}
                        ></span>
                        {item.selectedOptions.color}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* SIZE */}
                  <td className="p-2">
                    {item.selectedOptions?.size || "-"}
                  </td>

                  <td className="p-2">{item.quantity || 1}</td>
                  <td className="p-2">₹{item.price}</td>
                  <td className="p-2">₹{item.price * (item.quantity || 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 mt-4 text-sm md:flex-row md:justify-between">
          <p><strong>Total Items:</strong> {cartItems.length}</p>
          <p><strong>Total Quantity:</strong> {totalQty}</p>
          <p><strong>Delivery Type:</strong> {deliveryType}</p>
          <p className="font-semibold text-green-600">
            <strong>Total Amount:</strong> ₹{totalPrice}
          </p>
        </div>
      </div>

      {/* CONFIRM */}
      <div className="flex justify-end">
        <button
          onClick={handleConfirmOrder}
          className="px-6 py-3 text-white bg-green-600 rounded-full"
        >
          Confirm Order
        </button>
      </div>

      {/* SUCCESS MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]">
          <div className="p-6 text-center bg-white shadow-xl rounded-xl w-80">
            <h2 className="mb-2 text-lg font-semibold">
              🎉 Order Placed Successfully!
            </h2>
            <p className="text-sm text-gray-700">
              Order ID:
              <br />
              <span className="font-mono font-bold text-blue-600">
                {orderId}
              </span>
            </p>
            <button
              onClick={handleModalClose}
              className="px-4 py-2 mt-4 text-white bg-blue-600 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
