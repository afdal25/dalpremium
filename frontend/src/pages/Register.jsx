import { useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import {
  ADMIN_LOGIN_PATH,
  AUTH_API_PREFIX,
} from "../config/routes";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    registerSecret: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const passwordStrength =
    form.password.length >= 8
      ? "Kuat"
      : form.password.length >= 5
      ? "Sedang"
      : form.password.length > 0
      ? "Lemah"
      : "";

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const register = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.password ||
      !form.confirmPassword ||
      !form.registerSecret
    ) {
      toast.error("Semua field wajib diisi");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Confirm password tidak sama");
      return;
    }

    try {
      setLoading(true);

      await api.post(`${AUTH_API_PREFIX}/create-owner`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
        registerSecret: form.registerSecret,
      });

      toast.success("Register berhasil, silakan login");

      setTimeout(() => {
        window.location.href = ADMIN_LOGIN_PATH;
      }, 700);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Register gagal"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-950 to-black text-white flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[420px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-[fadeIn_0.4s_ease-in-out] sm:p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Register Admin
        </h1>

        <p className="text-zinc-400 mb-6 text-center">
          Buat akun admin baru
        </p>

        <div className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Nama"
            value={form.name}
            onChange={handleChange}
            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition"
          />

          <input
            type="text"
            name="phone"
            placeholder="Nomor HP"
            value={form.phone}
            onChange={handleChange}
            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition"
          />

          <textarea
            name="address"
            placeholder="Alamat lengkap"
            value={form.address}
            onChange={handleChange}
            className="w-full h-24 bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 pr-12 outline-none focus:border-indigo-500 transition"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          {passwordStrength && (
            <p className="text-sm text-zinc-400">
              Strength: {passwordStrength}
            </p>
          )}

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 pr-12 outline-none focus:border-indigo-500 transition"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showConfirmPassword ? "🙈" : "👁"}
            </button>
          </div>

          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              name="registerSecret"
              placeholder="Register Key"
              value={form.registerSecret}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  register();
                }
              }}
              className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 pr-12 outline-none focus:border-indigo-500 transition"
            />

            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showKey ? "🙈" : "👁"}
            </button>
          </div>

          <button
            onClick={register}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition py-3 rounded-xl"
          >
            {loading ? "Loading..." : "Register"}
          </button>

          <p className="text-center text-sm text-zinc-400">
            Sudah punya akun?{" "}
            <span
              onClick={() => {
                window.location.href = ADMIN_LOGIN_PATH;
              }}
              className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
