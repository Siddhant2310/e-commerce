import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";
import ProductImage from "../components/ProductImage.jsx";
import { orderApi, formatPrice, getImageUrl, getErrorMessage } from "../services/api.js";

// Add Razorpay later by flipping `available` to true for ONLINE and
// handling it in placeOrder() (see the comment there).
const PAYMENT_METHODS = [
  { id: "COD", label: "Cash on Delivery", available: true },
  { id: "ONLINE", label: "Online payment (coming soon)", available: false },
];

const FIELDS = [
  { name: "fullName", label: "Full name", auto: "name", span: 2 },
  { name: "phone", label: "Phone number", auto: "tel", type: "tel" },
  { name: "pincode", label: "Pincode", auto: "postal-code" },
  { name: "address", label: "Address", auto: "street-address", span: 2 },
  { name: "city", label: "City", auto: "address-level2" },
  { name: "state", label: "State", auto: "address-level1" },
];

function validate(f) {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = "Enter the recipient's name";
  if (!/^[6-9]\d{9}$/.test(f.phone.trim())) e.phone = "Enter a valid 10-digit mobile number";
  if (f.address.trim().length < 5) e.address = "Enter the full address";
  if (!f.city.trim()) e.city = "Enter your city";
  if (!f.state.trim()) e.state = "Enter your state";
  if (!/^\d{6}$/.test(f.pincode.trim())) e.pincode = "Enter a 6-digit pincode";
  return e;
}

export default function Checkout() {
  const { cart, subtotal, cartLoading, fetchCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState("COD");
  const [serverError, setServerError] = useState("");
  const [placing, setPlacing] = useState(false);

  if (cartLoading && cart.length === 0) return <Loader label="Loading checkout" />;
  if (cart.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const placeOrder = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    const firstInvalidField = FIELDS.find((field) => v[field.name]);
    if (firstInvalidField) {
      document.getElementById(firstInvalidField.name)?.focus();
      return;
    }
    setPlacing(true);
    setServerError("");
    try {
      // FUTURE RAZORPAY: if (method === "ONLINE") { ask backend to create a Razorpay order, open checkout, verify payment. }
      const order = await orderApi.create({ shippingAddress: form, paymentMethod: method });
      await fetchCart(); // backend decides what happens to the cart; we just re-read it
      showToast("Order placed successfully");
      navigate(order?.id ? `/orders/${order.id}` : "/my-orders", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "We could not place your order. Please try again."));
      setPlacing(false);
    }
  };

  return (
    <form onSubmit={placeOrder} noValidate className="container-x py-12">
      <h1 className="text-5xl text-forest sm:text-6xl">Checkout</h1>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-4 border border-maroon/30 bg-maroon/5 p-3 text-sm text-maroon">
          Please correct the highlighted delivery details before placing your order.
        </p>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <section>
            <h2 className="text-3xl text-forest">Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.name} className={f.span === 2 ? "sm:col-span-2" : ""}>
                  <label htmlFor={f.name} className="mb-1 block text-sm">{f.label}</label>
                  <input id={f.name} name={f.name} type={f.type || "text"} autoComplete={f.auto} value={form[f.name]} onChange={change} aria-invalid={Boolean(errors[f.name])} aria-describedby={errors[f.name] ? `${f.name}-error` : undefined} className="input" />
                  {errors[f.name] && <p id={`${f.name}-error`} className="field-error">{errors[f.name]}</p>}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl text-forest">Payment method</h2>
            <div className="mt-4 space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} className={`flex items-center gap-3 border p-4 ${m.available ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${method === m.id ? "border-forest bg-cream/60" : "border-sand"}`}>
                  <input type="radio" name="payment" className="accent-maroon" checked={method === m.id} disabled={!m.available} onChange={() => setMethod(m.id)} />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit border border-sand bg-cream/60 p-6 lg:sticky lg:top-32">
          <h2 className="text-3xl text-forest">Order summary</h2>
          <ul className="mt-4 divide-y divide-sand">
            {cart.map((item) => (
              <li key={item.product._id} className="flex gap-3 py-3">
                <div className="h-16 w-12 shrink-0 overflow-hidden bg-cream"><ProductImage src={getImageUrl(item.product)} alt={item.product.name} className="h-full w-full" /></div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-ink/60">Qty {item.quantity}</p>
                </div>
                <p className="text-sm">{formatPrice(item.product.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-sand pt-4 font-medium"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
          <p className="mt-1 text-xs text-ink/60">The final amount is calculated and confirmed by our server.</p>
          {serverError && <p role="alert" className="mt-4 border border-maroon/30 bg-maroon/5 p-3 text-sm text-maroon">{serverError}</p>}
          <button type="submit" disabled={placing} className="btn-primary mt-5 w-full">{placing ? "Placing order…" : "Place order"}</button>
        </aside>
      </div>
    </form>
  );
}
