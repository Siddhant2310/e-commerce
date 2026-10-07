import { useCallback, useEffect, useState } from "react";
import Loader from "../components/Loader.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { categoryApi, getErrorMessage } from "../services/api.js";

const EMPTY = { name: "", description: "" };

export default function Categories() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setItems(await categoryApi.list()); }
    catch (e) { setError(getErrorMessage(e, "Could not load categories.")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(EMPTY); setEditingId(null); setFormError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setFormError("Name must be at least 2 characters");
    setSaving(true);
    setFormError("");
    try {
      const body = { name: form.name.trim(), description: form.description.trim() };
      if (editingId) await categoryApi.update(editingId, body); else await categoryApi.create(body);
      showToast(editingId ? "Category updated" : "Category created");
      reset();
      await load();
    } catch (err) { setFormError(getErrorMessage(err, "Could not save the category.")); }
    finally { setSaving(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"? Products using it will lose their category link.`)) return;
    try { await categoryApi.remove(c._id); showToast("Category deleted"); await load(); }
    catch (e) { showToast(getErrorMessage(e, "Could not delete the category"), "error"); }
  };

  return (
    <div>
      <h1 className="text-4xl text-forest sm:text-5xl">Categories</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[340px_1fr]">
        <form onSubmit={submit} noValidate className="h-fit border border-sand bg-white/60 p-5">
          <h2 className="text-2xl text-forest">{editingId ? "Edit category" : "New category"}</h2>
          {formError && <p role="alert" className="mt-3 border border-maroon/30 bg-maroon/5 p-2 text-sm text-maroon">{formError}</p>}
          <label htmlFor="cname" className="label mt-4">Name</label>
          <input id="cname" className="input" maxLength={50} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label htmlFor="cdesc" className="label mt-4">Description (optional)</label>
          <textarea id="cdesc" rows={3} className="input" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <p className="mt-2 text-xs text-ink/60">Names are saved in lowercase by your backend.</p>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : editingId ? "Save" : "Add category"}</button>
            {editingId && <button type="button" onClick={reset} className="btn-outline">Cancel</button>}
          </div>
        </form>

        <div>
          {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={load} /> : items.length === 0 ? (
            <p className="border border-sand bg-cream/60 p-8 text-center text-ink/70">No categories yet. Add one to start adding products.</p>
          ) : (
            <ul className="divide-y divide-sand border border-sand bg-white/60">
              {items.map((c) => (
                <li key={c._id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize">{c.name}</p>
                    {c.description && <p className="truncate text-sm text-ink/60">{c.description}</p>}
                  </div>
                  <button className="btn-outline !px-3 !py-1.5" onClick={() => { setEditingId(c._id); setForm({ name: c.name, description: c.description || "" }); setFormError(""); }}>Edit</button>
                  <button className="btn-danger" onClick={() => remove(c)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
