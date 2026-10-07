import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../services/api.js";
import Jaali from "../components/Jaali.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (form.name.trim().length < 4 || form.name.trim().length > 30) v.name = "Name must be 4 to 30 characters";
    if (!EMAIL_RE.test(form.email)) v.email = "Enter a valid email address";
    if (form.password.length < 6) v.password = "Use at least 6 characters";
    if (form.confirm !== form.password) v.confirm = "Passwords do not match";
    setErrors(v);
    if (Object.keys(v).length) return;
    setSubmitting(true);
    setServerError("");
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      showToast("Account created. Please sign in.");
      navigate("/login", { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not create your account."));
    } finally { setSubmitting(false); }
  };

  const field = (name, label, type = "text", auto) => (
    <div className="mt-4">
      <label htmlFor={name} className="mb-1 block text-sm">{label}</label>
      <input id={name} name={name} type={type} autoComplete={auto} value={form[name]} onChange={change} className="input" />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="container-x grid min-h-[70vh] items-center py-12 lg:grid-cols-2">
      <div className="relative hidden h-full min-h-[560px] overflow-hidden bg-maroon p-12 text-ivory lg:flex lg:flex-col lg:justify-end">
        <Jaali opacity={0.18} size={72} />
        <h2 className="relative text-6xl">Join Lucknowi Nazakat</h2>
        <p className="relative mt-3 max-w-sm text-ivory/80">Create an account to save your cart and follow every order from our workshop to your door.</p>
      </div>
      <form onSubmit={submit} noValidate className="mx-auto w-full max-w-md py-10 lg:px-4">
        <h1 className="text-5xl text-forest">Create account</h1>
        {serverError && <p role="alert" className="mt-5 border border-maroon/30 bg-maroon/5 p-3 text-sm text-maroon">{serverError}</p>}
        {field("name", "Full name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("password", "Password", "password", "new-password")}
        {field("confirm", "Confirm password", "password", "new-password")}
        <button type="submit" disabled={submitting} className="btn-primary mt-7 w-full">{submitting ? "Creating account…" : "Create account"}</button>
        <p className="mt-5 text-sm text-ink/70">Already registered? <Link to="/login" className="text-maroon underline underline-offset-4">Sign in</Link></p>
      </form>
    </div>
  );
}
