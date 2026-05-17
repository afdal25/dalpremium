import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function MyAccount() {
  const [account, setAccount] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    address: "",
    createdAt: "",
    lastLoginAt: "",
  });

  const [passwordForm, setPasswordForm] =
    useState({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [showOldPassword, setShowOldPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const response = await api.get("/me");
      setAccount(response.data);
    } catch (error) {
      toast.error("Gagal mengambil data akun");
    }
  };

  const handleAccountChange = (e) => {
    setAccount({
      ...account,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const updateAccount = async () => {
    try {
      setLoading(true);

      const response = await api.put("/me", {
        name: account.name,
        phone: account.phone,
        address: account.address,
      });

      localStorage.setItem(
        "user",
        JSON.stringify(response.data)
      );

      toast.success("Profil berhasil diupdate");
    } catch (error) {
      toast.error("Gagal update profil");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    try {
      setLoading(true);

      await api.put("/me/password", passwordForm);

      toast.success("Password berhasil diganti");

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal mengganti password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        My Account
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-5">
            Account
          </h2>

          <div className="space-y-4">
            <input
              name="name"
              value={account.name || ""}
              onChange={handleAccountChange}
              placeholder="Nama"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
            />

            <input
              value={account.email || ""}
              disabled
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 opacity-60"
            />

            <input
              value={account.role || ""}
              disabled
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 opacity-60"
            />

            <input
              name="phone"
              value={account.phone || ""}
              onChange={handleAccountChange}
              placeholder="Nomor HP"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
            />

            <textarea
              name="address"
              value={account.address || ""}
              onChange={handleAccountChange}
              placeholder="Alamat lengkap"
              className="w-full h-28 bg-zinc-800 border border-zinc-700 rounded-xl p-3"
            />

            <div className="text-sm text-zinc-400 space-y-2">
              <p>
                Bergabung:{" "}
                {account.createdAt
                  ? new Date(
                      account.createdAt
                    ).toLocaleString()
                  : "-"}
              </p>

              <p>
                Terakhir login:{" "}
                {account.lastLoginAt
                  ? new Date(
                      account.lastLoginAt
                    ).toLocaleString()
                  : "-"}
              </p>
            </div>

            <button
              onClick={updateAccount}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-3 rounded-xl"
            >
              {loading
                ? "Saving..."
                : "Simpan Profil"}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-5">
            Password
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={
                  showOldPassword
                    ? "text"
                    : "password"
                }
                name="oldPassword"
                value={
                  passwordForm.oldPassword
                }
                onChange={
                  handlePasswordChange
                }
                placeholder="Password lama"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 pr-12"
              />

              <button
                type="button"
                onClick={() =>
                  setShowOldPassword(
                    !showOldPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showOldPassword
                  ? "👁"
                  : "👁"}
              </button>
            </div>

            <div className="relative">
              <input
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                name="newPassword"
                value={
                  passwordForm.newPassword
                }
                onChange={
                  handlePasswordChange
                }
                placeholder="Password baru"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 pr-12"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(
                    !showNewPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showNewPassword
                  ? "👁"
                  : "👁"}
              </button>
            </div>

            <div className="relative">
              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                value={
                  passwordForm.confirmPassword
                }
                onChange={
                  handlePasswordChange
                }
                placeholder="Konfirmasi password baru"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 pr-12"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword
                  ? "👁"
                  : "👁"}
              </button>
            </div>

            <button
              onClick={updatePassword}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 px-5 py-3 rounded-xl text-black"
            >
              {loading
                ? "Saving..."
                : "Ganti Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}