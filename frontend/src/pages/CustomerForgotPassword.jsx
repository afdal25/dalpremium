import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  CUSTOMER_API_PREFIX,
  CUSTOMER_LOGIN_PATH,
} from "../config/routes";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";

export default function CustomerForgotPassword() {
  const [form, setForm] = useState({
    email: "",
    phone: "",
    resetToken: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const requestReset = async () => {
    if (!form.email || !form.phone) {
      toast.error("Email dan nomor HP wajib diisi");
      return;
    }

    try {
      setRequesting(true);
      const response = await api.post(
        `${CUSTOMER_API_PREFIX}/forgot-password`,
        {
          email: form.email,
          phone: form.phone,
        }
      );

      toast.success(response.data.message || "OTP dikirim ke WhatsApp");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal mengirim OTP"
      );
    } finally {
      setRequesting(false);
    }
  };

  const resetPassword = async () => {
    if (
      !form.email ||
      !form.resetToken ||
      !form.password ||
      !form.confirmPassword
    ) {
      toast.error("Semua field wajib diisi");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }

    try {
      setLoading(true);
      await api.post(
        `${CUSTOMER_API_PREFIX}/reset-password`,
        {
          email: form.email,
          resetToken: form.resetToken,
          password: form.password,
        }
      );

      toast.success("Password berhasil diganti");
      window.location.href = CUSTOMER_LOGIN_PATH;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal reset password"
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
            <span className="h-full w-full opacity-0" />
          </Link>

          <h1 className="text-center text-3xl font-black">
            Lupa Password
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-400">
            OTP akan dikirim ke WhatsApp yang terdaftar.
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

            <input
              type="tel"
              name="phone"
              placeholder="Nomor HP / WhatsApp"
              value={form.phone}
              onChange={handleChange}
              className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
            />

            <button
              type="button"
              onClick={requestReset}
              disabled={requesting}
              className="h-12 w-full rounded-lg border border-[#d5a756]/30 bg-[#d5a756]/10 font-black text-[#f0cf87] transition hover:bg-[#d5a756]/20 disabled:opacity-60"
            >
              {requesting ? "Mengirim OTP..." : "Kirim OTP"}
            </button>

            <input
              type="text"
              name="resetToken"
              placeholder="Kode OTP"
              value={form.resetToken}
              onChange={handleChange}
              className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password baru"
                value={form.password}
                onChange={handleChange}
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

            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Konfirmasi password baru"
              value={form.confirmPassword}
              onChange={handleChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  resetPassword();
                }
              }}
              className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
            />

            <button
              type="button"
              onClick={resetPassword}
              disabled={loading}
              className="h-12 w-full rounded-lg bg-[#d5a756] font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Ganti Password"}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-zinc-400">
            Ingat password?{" "}
            <Link
              to={CUSTOMER_LOGIN_PATH}
              className="font-bold text-[#d5a756] hover:text-[#f0cf87]"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
      </main>
    </div>
  );
}
