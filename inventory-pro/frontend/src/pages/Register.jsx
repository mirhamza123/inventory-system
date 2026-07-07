import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", form);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h2 className="mb-6 text-2xl font-semibold">Create Account</h2>
        <input
          className="mb-3 w-full rounded border p-3"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="mb-3 w-full rounded border p-3"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="mb-4 w-full rounded border p-3"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="w-full rounded bg-slate-900 px-4 py-3 text-white">
          Register
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account?{" "}
          <a href="/" className="text-blue-600">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
