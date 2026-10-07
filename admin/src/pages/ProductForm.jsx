import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import Thumb from "../components/Thumb.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { productApi, categoryApi, categoryOf, getErrorMessage } from "../services/api.js";

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024; // backend limit: 5 MB each
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];
const toList = (text) => text.split(",").map((s) => s.trim()).filter(Boolean);

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category: "", sizes: "", colors: "" });
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setCategories(await categoryApi.list());
        if (isEdit) {
          const p = await productApi.get(id);
          setForm({
            name: p.name, description: p.description, price: String(p.price), stock: String(p.stock),
            category: categoryOf(p)._id, sizes: (p.sizes || []).join(", "), colors: (p.colors || []).join(", "),
          });
          setExistingImages(p.images || []);
        }
      } catch (e) { setLoadError(getErrorMessage(e, "Could not load the form data.")); }
      finally { setLoading(false); }
    })();
  }, [id, isEdit]);

  // preview URLs for newly chosen files; revoked when the selection changes
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickFiles = (e) => {
    const picked = [...e.target.files];
    e.target.value = "";
    const bad = picked.find((f) => !OK_TYPES.includes(f.type) || f.size > MAX_SIZE);
    if (bad) return setErrors((er) => ({ ...er, images: `"${bad.name}" must be a JPG, PNG or WEBP image under 5 MB.` }));
    const next = [...files, ...picked];
    if (next.length > MAX_IMAGES) return setErrors((er) => ({ ...er, images: `You can upload at most ${MAX_IMAGES} images at a time.` }));
    setErrors((er) => ({ ...er, images: undefined }));
    setFiles(next);
  };

  const validate = () => {
    const v = {};
    if (form.name.trim().length < 2) v.name = "Name must be at least 2 characters";
    if (!form.description.trim()) v.description = "Add a description";
    if (form.price === "" || Number(form.price) < 0 || Number.isNaN(Number(form.price))) v.price = "Enter a valid price";
    if (form.stock === "" || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) v.stock = "Stock must be a whole number, 0 or more";
    if (!form.category) v.category = "Choose a category";
    if (!isEdit && files.length === 0) v.images = "Add at least one image";
    return v;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    const body = new FormData();
    body.append("name", form.name.trim());
    body.append("description", form.description.trim());
    body.append("price", form.price);
    body.append("stock", form.stock);
    body.append("category", form.category);
    body.append("sizes", JSON.stringify(toList(form.sizes)));   // JSON so an empty list can clear old values
    body.append("colors", JSON.stringify(toList(form.colors)));
    files.forEach((f) => body.append("images", f));
    setSaving(true);
    setServerError("");
    try {
      if (isEdit) await productApi.update(id, body); else await productApi.create(body);
      showToast(isEdit ? "Product updated" : "Product created");
      navigate("/products");
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not save the product."));
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (loadError) return <ErrorBox message={loadError} />;

  const err = (k) => errors[k] && <p className="field-error">{errors[k]}</p>;

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl">
      <Link to="/products" className="text-sm text-forest underline underline-offset-4">Back to products</Link>
      <h1 className="mt-2 text-4xl text-forest sm:text-5xl">{isEdit ? "Edit product" : "Add product"}</h1>
      {serverError && <p role="alert" className="mt-4 border border-maroon/30 bg-maroon/5 p-3 text-sm text-maroon">{serverError}</p>}

      {categories.length === 0 && (
        <p className="mt-4 border border-gold/50 bg-gold/10 p-3 text-sm">You need a category first. <Link to="/categories" className="underline">Create one</Link>.</p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" className="input" value={form.name} onChange={change} maxLength={120} />{err("name")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" name="description" rows={4} className="input" value={form.description} onChange={change} maxLength={2000} />{err("description")}
        </div>
        <div>
          <label htmlFor="price" className="label">Price (₹)</label>
          <input id="price" name="price" type="number" min="0" step="any" className="input" value={form.price} onChange={change} />{err("price")}
        </div>
        <div>
          <label htmlFor="stock" className="label">Stock</label>
          <input id="stock" name="stock" type="number" min="0" step="1" className="input" value={form.stock} onChange={change} />{err("stock")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="category" className="label">Category</label>
          <select id="category" name="category" className="input capitalize" value={form.category} onChange={change}>
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>{err("category")}
        </div>
        <div>
          <label htmlFor="sizes" className="label">Sizes <span className="font-normal text-ink/50">(comma separated)</span></label>
          <input id="sizes" name="sizes" placeholder="S, M, L, XL" className="input" value={form.sizes} onChange={change} />
        </div>
        <div>
          <label htmlFor="colors" className="label">Colours <span className="font-normal text-ink/50">(comma separated)</span></label>
          <input id="colors" name="colors" placeholder="White, Peach" className="input" value={form.colors} onChange={change} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="images" className="label">{isEdit ? "Add more images" : "Images"} <span className="font-normal text-ink/50">(JPG, PNG or WEBP, up to 5 MB each)</span></label>
          <input id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pickFiles} className="block w-full text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-forest file:px-4 file:py-2 file:text-ivory" />
          {err("images")}
          {isEdit && existingImages.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-ink/60">Current images (your backend can add images but not remove single ones)</p>
              <div className="mt-1 flex flex-wrap gap-2">{existingImages.map((u) => <Thumb key={u} src={u} className="h-24 w-20" />)}</div>
            </div>
          )}
          {files.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-ink/60">New images to upload</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={f.name + i} className="relative">
                    <img src={previews[i]} alt={f.name} className="h-24 w-20 object-cover" />
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-maroon text-xs text-ivory">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}</button>
        <Link to="/products" className="btn-outline">Cancel</Link>
      </div>
      {saving && files.length > 0 && <p className="mt-3 text-sm text-ink/60">Uploading images. This can take a few seconds.</p>}
    </form>
  );
}
