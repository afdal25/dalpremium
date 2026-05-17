import { useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import {
  ADMIN_DASHBOARD_PATH,
  AUTH_API_PREFIX,
} from "../config/routes";

export default function Login() {
  const [form, setForm] = useState({
    email: localStorage.getItem("rememberEmail") || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(localStorage.getItem("rememberEmail")));

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const login = async () => {
    if (!form.email || !form.password) {
      toast.error("Email dan password wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`${AUTH_API_PREFIX}/sign-in`, form);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      if (rememberMe) {
        localStorage.setItem("rememberEmail", form.email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      toast.success("Login berhasil");
      setTimeout(() => {
        window.location.href = ADMIN_DASHBOARD_PATH;
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-theme flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0d0a] px-4 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(213,167,86,.16),transparent_32%),linear-gradient(135deg,#0f0d0a,#050403)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-[#d5a756]/20 bg-[#17130f]/95 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#d5a756]/25 bg-black">
          <span className="h-full w-full opacity-0" />
        </div>

        <h1 className="text-center text-3xl font-black text-[#d5a756]">Masuk Admin</h1>
        <p className="mb-6 mt-2 text-center text-sm text-zinc-400">
          Kelola produk, pesanan, content, dan pengaturan DALPREMIUM.
        </p>

        <div className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email admin"
            value={form.email}
            onChange={handleChange}
            className="h-12 w-full rounded-lg border border-[#d5a756]/15 bg-black/30 px-4 outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  login();
                }
              }}
              className="h-12 w-full rounded-lg border border-[#d5a756]/15 bg-black/30 px-4 pr-20 outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#f0cf87] hover:text-white"
            >
              {showPassword ? "Sembunyi" : "Lihat"}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="accent-[#d5a756]"
            />
            Ingat email admin
          </label>

          <button
            type="button"
            onClick={login}
            disabled={loading}
            className="h-12 w-full rounded-lg bg-[#d5a756] font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </div>
      </div>
    </div>
  );
}
