import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  CUSTOMER_API_PREFIX,
  CUSTOMER_FORGOT_PASSWORD_PATH,
  CUSTOMER_REGISTER_PATH,
} from "../config/routes";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";

export default function CustomerLogin() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const response = await api.post(
        `${CUSTOMER_API_PREFIX}/login`,
        form
      );

      localStorage.setItem(
        "customerToken",
        response.data.token
      );
      localStorage.setItem(
        "customerUser",
        JSON.stringify(response.data.user)
      );

      toast.success("Login berhasil");
      window.location.href = "/";
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login customer gagal"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar />
      <main className="px-4 py-8 sm:px-5 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center">
        <div className="w-full rounded-lg border border-[#d5a756]/20 bg-[#17130f] p-6 shadow-2xl shadow-black/40">
          <Link
            to="/"
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#d5a756]/20 bg-black"
          >
            <span className="h-8 w-8 rounded-full bg-[#d5a756]/20" />
          </Link>

          <h1 className="text-center text-3xl font-black">
            Masuk Customer
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Login untuk menyimpan data pesanan lebih mudah.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
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
                className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 pr-14 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-lg px-3 text-sm font-bold text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                {showPassword ? "Tutup" : "Lihat"}
              </button>
            </div>

            <div className="text-right">
              <Link
                to={CUSTOMER_FORGOT_PASSWORD_PATH}
                className="text-sm font-bold text-[#d5a756] hover:text-[#f0cf87]"
              >
                Lupa password?
              </Link>
            </div>

            <button
              type="button"
              onClick={login}
              disabled={loading}
              className="h-12 w-full rounded-lg bg-[#d5a756] font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-zinc-400">
            Belum punya akun?{" "}
            <Link
              to={CUSTOMER_REGISTER_PATH}
              className="font-bold text-[#d5a756] hover:text-[#f0cf87]"
            >
              Daftar
            </Link>
          </p>
        </div>
      </div>
      </main>
    </div>
  );
}
