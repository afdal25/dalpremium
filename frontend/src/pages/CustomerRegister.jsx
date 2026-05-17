import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  CUSTOMER_API_PREFIX,
  CUSTOMER_LOGIN_PATH,
} from "../config/routes";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";

export default function CustomerRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

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
      !form.confirmPassword
    ) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `${CUSTOMER_API_PREFIX}/register`,
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }
      );

      localStorage.setItem(
        "customerToken",
        response.data.token
      );
      localStorage.setItem(
        "customerUser",
        JSON.stringify(response.data.user)
      );

      toast.success("Register berhasil");
      window.location.href = "/";
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Register customer gagal"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar />
      <main className="px-4 py-8 sm:px-5 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-lg items-center">
        <div className="w-full rounded-lg border border-[#d5a756]/20 bg-[#17130f] p-6 shadow-2xl shadow-black/40">
          <Link
            to="/"
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#d5a756]/20 bg-black"
          >
            <span className="h-full w-full opacity-0" />
          </Link>

          <h1 className="text-center text-3xl font-black">
            Daftar Customer
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Buat akun untuk checkout dan cek pesanan lebih cepat.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              name="name"
              placeholder="Nama"
              value={form.name}
              onChange={handleChange}
              className="h-12 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756] sm:col-span-2"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="h-12 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756] sm:col-span-2"
            />

            <input
              type="text"
              name="phone"
              placeholder="Nomor HP"
              value={form.phone}
              onChange={handleChange}
              className="h-12 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756] sm:col-span-2"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
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

            <div className="relative">
              <input
                type={
                  showConfirmPassword ? "text" : "password"
                }
                name="confirmPassword"
                placeholder="Konfirmasi Password"
                value={form.confirmPassword}
                onChange={handleChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    register();
                  }
                }}
                className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 pr-14 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-lg px-3 text-sm font-bold text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                {showConfirmPassword ? "Tutup" : "Lihat"}
              </button>
            </div>

            <button
              type="button"
              onClick={register}
              disabled={loading}
              className="h-12 rounded-lg bg-[#d5a756] font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-60 sm:col-span-2"
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-zinc-400">
            Sudah punya akun?{" "}
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
