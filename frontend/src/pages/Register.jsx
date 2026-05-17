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

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const register = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword ||
      !form.registerSecret
    ) {
      toast.error("Nama, email, password, dan kode register wajib diisi");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }

    try {
      setLoading(true);
      await api.post(`${AUTH_API_PREFIX}/create-owner`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        registerSecret: form.registerSecret,
      });

      toast.success("Register berhasil, silakan login");
      setTimeout(() => {
        window.location.href = ADMIN_LOGIN_PATH;
      }, 700);
    } catch (error) {
      toast.error(error.response?.data?.message || "Register gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-theme flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0d0a] px-4 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(213,167,86,.16),transparent_32%),linear-gradient(135deg,#0f0d0a,#050403)]" />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#d5a756]/20 bg-[#17130f]/95 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#d5a756]/25 bg-black">
          <span className="h-full w-full opacity-0" />
        </div>

        <h1 className="text-center text-3xl font-black text-[#d5a756]">Daftar Admin</h1>
        <p className="mb-6 mt-2 text-center text-sm text-zinc-400">
          Buat akun pengelola baru dengan kode register yang valid.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            name="name"
            placeholder="Nama"
            value={form.name}
            onChange={handleChange}
            className="h-12 rounded-lg border border-[#d5a756]/15 bg-black/30 px-4 outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756] sm:col-span-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="h-12 rounded-lg border border-[#d5a756]/15 bg-black/30 px-4 outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
          />
          <input
            type="text"
            name="phone"
            placeholder="Nomor HP (opsional)"
            value={form.phone}
            onChange={handleChange}
            className="h-12 rounded-lg border border-[#d5a756]/15 bg-black/30 px-4 outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
          />

          <PasswordField
            name="password"
            placeholder="Password"
            value={form.password}
            visible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            onChange={handleChange}
          />
          <PasswordField
            name="confirmPassword"
            placeholder="Konfirmasi Password"
            value={form.confirmPassword}
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            onChange={handleChange}
          />

          {passwordStrength && (
            <p className="text-sm font-semibold text-zinc-400 sm:col-span-2">
              Kekuatan password:{" "}
              <span className="text-[#f0cf87]">{passwordStrength}</span>
            </p>
          )}

          <div className="relative sm:col-span-2">
            <input
              type={showKey ? "text" : "password"}
              name="registerSecret"
              placeholder="Kode register admin"
              value={form.registerSecret}
              onChange={handleChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  register();
                }
              }}
              className="h-12 w-full rounded-lg border border-[#d5a756]/15 bg-black/30 px-4 pr-20 outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#f0cf87] hover:text-white"
            >
              {showKey ? "Sembunyi" : "Lihat"}
            </button>
          </div>

          <button
            type="button"
            onClick={register}
            disabled={loading}
            className="h-12 rounded-lg bg-[#d5a756] font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Memproses..." : "Daftar Admin"}
          </button>

          <p className="text-center text-sm text-zinc-400 sm:col-span-2">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => {
                window.location.href = ADMIN_LOGIN_PATH;
              }}
              className="font-black text-[#f0cf87] hover:text-white"
            >
              Masuk
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  name,
  placeholder,
  value,
  visible,
  onToggle,
  onChange,
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-lg border border-[#d5a756]/15 bg-black/30 px-4 pr-20 outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#f0cf87] hover:text-white"
      >
        {visible ? "Sembunyi" : "Lihat"}
      </button>
    </div>
  );
}
