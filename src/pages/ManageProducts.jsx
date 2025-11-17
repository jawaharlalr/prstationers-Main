import { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, ArrowLeft, Trash2, Pencil } from "lucide-react";

// AVAILABLE COLORS WITH PREVIEW (HEX)
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
  { name: "Olive", hex: "#808000" }
];

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    sizes: "",
    colors: [],
    image: null,
    imageUrl: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const resetForm = () => {
    setEditId(null);
    setShowForm(false);
    setForm({
      name: "",
      category: "",
      price: "",
      sizes: "",
      colors: [],
      image: null,
      imageUrl: "",
    });
  };

  // ADD or UPDATE PRODUCT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const sizesArr = form.sizes
      ? form.sizes.split(",").map((s) => s.trim())
      : [];

    let imageUrl = form.imageUrl;

    if (form.image instanceof File) {
      const imgRef = ref(storage, `productImages/${form.image.name}`);
      await uploadBytes(imgRef, form.image);
      imageUrl = await getDownloadURL(imgRef);
    }

    const data = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      sizes: sizesArr,
      colors: form.colors,
      imageUrl,
    };

    if (editId) {
      await updateDoc(doc(db, "products", editId), data);
    } else {
      await addDoc(collection(db, "products"), data);
    }

    resetForm();
    loadProducts();
  };

  // DELETE PRODUCT
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "products", id));
    loadProducts();
  };

  // EDIT PRODUCT
  const handleEdit = (product) => {
    setShowForm(true);
    setEditId(product.id);

    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      sizes: product.sizes?.join(", ") || "",
      colors: product.colors || [],
      image: null,
      imageUrl: product.imageUrl || "",
    });
  };

  return (
    <div className="p-6">
      {!showForm ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Manage Products</h1>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center p-2 text-white bg-blue-500 shadow rounded-xl"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="p-6 overflow-x-auto bg-white shadow rounded-xl">
            <table className="w-full">
              <thead className="bg-gray-100 border">
                <tr>
                  <th className="p-3 text-left">S.No</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Colors</th>
                  <th className="p-3 text-left">Sizes</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p, i) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.category}</td>

                    {/* Color preview boxes */}
                    <td className="flex gap-2 p-3">
                      {p.colors?.map((c) => {
                        const colorObj = allColors.find((x) => x.name === c);
                        return (
                          <div
                            key={c}
                            title={c}
                            className="w-5 h-5 border rounded"
                            style={{ backgroundColor: colorObj?.hex }}
                          ></div>
                        );
                      })}
                    </td>

                    <td className="p-3">{p.sizes?.join(", ")}</td>
                    <td className="p-3">₹{p.price}</td>

                    <td className="flex gap-3 p-3">
                      <button
                        className="text-blue-500"
                        onClick={() => handleEdit(p)}
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        className="text-red-500"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </>
      ) : (
        <div className="max-w-lg p-6 mx-auto bg-white shadow rounded-xl">
          <button
            onClick={resetForm}
            className="flex items-center gap-2 mb-4 text-gray-600"
          >
            <ArrowLeft size={20} /> Back
          </button>

          <h2 className="mb-4 text-xl font-bold">
            {editId ? "Edit Product" : "Add Product"}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              className="w-full p-2 border rounded"
              placeholder="Product Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              className="w-full p-2 border rounded"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />

            <input
              type="number"
              className="w-full p-2 border rounded"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />

            <input
              className="w-full p-2 border rounded"
              placeholder="Available Sizes (comma separated)"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            />

            {/* COLOR PICKER GRID */}
            <div>
              <label className="block mb-2 font-semibold">Available Colors</label>

              <div className="grid grid-cols-6 gap-3">
                {allColors.map((c) => {
                  const isSelected = form.colors?.includes(c.name);

                  return (
                    <div
                      key={c.name}
                      onClick={() => {
                        let updated = [...form.colors];
                        if (isSelected) {
                          updated = updated.filter((col) => col !== c.name);
                        } else {
                          updated.push(c.name);
                        }
                        setForm({ ...form, colors: updated });
                      }}
                      className={`w-10 h-10 rounded cursor-pointer border 
                        ${isSelected ? "border-4 border-blue-600" : "border-gray-300"}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    ></div>
                  );
                })}
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, image: e.target.files[0] })
              }
            />

            <button className="w-full p-2 text-white bg-blue-600 rounded-xl">
              {editId ? "Update Product" : "Add Product"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
