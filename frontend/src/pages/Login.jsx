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
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(
      localStorage.getItem("rememberEmail")
        ? true
        : false
    );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const login = async () => {
    if (!form.email || !form.password) {
      toast.error("Email dan password wajib diisi");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        `${AUTH_API_PREFIX}/sign-in`,
        form
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      if (rememberMe) {
        localStorage.setItem(
          "rememberEmail",
          form.email
        );
      } else {
        localStorage.removeItem("rememberEmail");
      }

      toast.success("Login berhasil");

      setTimeout(() => {
        window.location.href =
          ADMIN_DASHBOARD_PATH;
      }, 500);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Email atau password salah"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-950 to-black text-white flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-[fadeIn_0.4s_ease-in-out] sm:p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Login
        </h1>

        <p className="text-zinc-400 mb-6 text-center">
          Masuk ke dashboard management
        </p>

        <div className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 outline-none focus:border-indigo-500 transition"
          />

          <div className="relative">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login();
                }
              }}
              className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 pr-12 outline-none focus:border-indigo-500 transition"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) =>
                setRememberMe(e.target.checked)
              }
            />
            Remember me
          </label>

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition py-3 rounded-xl"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
