import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Sends the visitor to /products?q=... ; the Products page does the filtering.
export default function SearchBar({ onDone }) {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const q = text.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setText("");
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md" role="search">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search kurtis, sarees, dupattas" aria-label="Search products" className="input !py-2" />
      <button type="submit" className="btn-green !px-4 !py-2">Search</button>
    </form>
  );
}
