import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/api.js";

export default function Login() {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAdmin) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError("Enter your email and password.");
    setBusy(true);
    setError("");
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.notAdmin ? err.message : getErrorMessage(err, "Could not sign in."));
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-dark px-4">
      <form onSubmit={submit} noValidate className="w-full max-w-sm bg-ivory p-8">
        <p className="text-sm text-gold">Lucknowi Nazakat</p>
        <h1 className="text-4xl text-forest">Admin sign in</h1>
        {error && <p role="alert" className="mt-4 border border-maroon/30 bg-maroon/5 p-3 text-sm text-maroon">{error}</p>}
        <div className="mt-5">
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="mt-4">
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
