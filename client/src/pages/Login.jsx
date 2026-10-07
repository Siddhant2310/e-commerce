import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../services/api.js";
import Jaali from "../components/Jaali.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from || "/";
  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!EMAIL_RE.test(form.email)) v.email = "Enter a valid email address";
    if (!form.password) v.password = "Enter your password";
    setErrors(v);
    if (Object.keys(v).length) return;
    setSubmitting(true);
    setServerError("");
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      showToast(`Welcome back, ${user?.name?.split(" ")[0] || "there"}`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not sign in. Check your email and password."));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="container-x grid min-h-[70vh] items-center py-12 lg:grid-cols-2">
      <div className="relative hidden h-full min-h-[480px] overflow-hidden bg-forest p-12 text-ivory lg:flex lg:flex-col lg:justify-end">
        <Jaali opacity={0.2} size={72} />
        <h2 className="relative text-6xl">Welcome back</h2>
        <p className="relative mt-3 max-w-sm text-ivory/75">Sign in to see your cart, track orders and pick up where you left off.</p>
      </div>
      <form onSubmit={submit} noValidate className="mx-auto w-full max-w-md py-10 lg:px-4">
        <h1 className="text-5xl text-forest">Sign in</h1>
        {serverError && <p role="alert" className="mt-5 border border-maroon/30 bg-maroon/5 p-3 text-sm text-maroon">{serverError}</p>}
        <div className="mt-6">
          <label htmlFor="email" className="mb-1 block text-sm">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} className="input" />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div className="mt-4">
          <label htmlFor="password" className="mb-1 block text-sm">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={change} className="input" />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <button type="submit" disabled={submitting} className="btn-primary mt-7 w-full">{submitting ? "Signing in…" : "Sign in"}</button>
        <p className="mt-5 text-sm text-ink/70">New here? <Link to="/register" className="text-maroon underline underline-offset-4">Create an account</Link></p>
      </form>
    </div>
  );
}
