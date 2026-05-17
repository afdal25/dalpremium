import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api";

export default function InviteModal({
  selectedEmail,
  onClose,
}) {
  const [invites, setInvites] =
    useState([]);

  const [deleteId, setDeleteId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [addLoading, setAddLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [form, setForm] = useState({
    customerEmail: "",
    status: "PENDING",
  });

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await api.get(
        `/emails/${selectedEmail.id}/invites`
      );

      setInvites(response.data);
    } catch (error) {
      toast.error("Gagal mengambil data invite");
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addInvite = async () => {
  if (!form.customerEmail) {
    toast.error("Email customer wajib diisi");
    return;
  }

  try {
    setAddLoading(true);

    await api.post(
      `/emails/${selectedEmail.id}/invites`,
      form
    );

    toast.success("Email customer berhasil ditambahkan");

    fetchInvites();

    setForm({
      customerEmail: "",
      status: "PENDING",
    });
  } catch (error) {
  toast.error(
    error.response?.data?.message ||
      "Gagal menambahkan email customer"
  );
} finally {
    setAddLoading(false);
  }
};

  const updateInviteStatus = async (
    id,
    status
  ) => {
    try {
      await api.put(`/invites/${id}`, {
        status,
      });

      toast.success("Status email customer berhasil diubah");

      fetchInvites();
    } catch (error) {
      toast.error("Gagal mengubah status email customer");
    }
  };

  const confirmDeleteInvite = async () => {
  try {
    setDeleteLoading(true);

    await api.delete(`/invites/${deleteId}`);

    toast.success("Email customer berhasil dihapus");

    setDeleteId(null);

    fetchInvites();
  } catch (error) {
    toast.error("Gagal menghapus email customer");
  } finally {
    setDeleteLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-[800px] p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Invite Email Customer
            </h2>

            <p className="text-zinc-400">
              {selectedEmail.email}
            </p>
          </div>

          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-xl"
          >
            Close
          </button>
        </div>

        {/* Add Invite */}
        <div className="bg-zinc-800 rounded-2xl p-5 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Tambahkan Email Customer
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="email"
              name="customerEmail"
              placeholder="Masukan email customer..."
              value={form.customerEmail}
              onChange={handleChange}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-3"
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-3"
            >
              <option value="PENDING">
                PENDING
              </option>

              <option value="ACCEPTED">
                ACCEPTED
              </option>

              <option value="EXPIRED">
                EXPIRED
              </option>
            </select>
          </div>

          <button
  onClick={addInvite}
  disabled={addLoading}
  className="mt-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-3 rounded-xl"
>
  {addLoading
    ? "Loading..."
    : "Tambah email customer"}
</button>
        </div>

        {/* Table */}
        <div className="bg-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-700">
              <tr>
                <th className="text-left p-4">
                  Email Customer
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-left p-4">
                  Date
                </th>

                <th className="text-left p-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {invites.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-zinc-700"
                >
                  <td className="p-4">
                    {item.customerEmail}
                  </td>

                  <td className="p-4">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateInviteStatus(
                          item.id,
                          e.target.value
                        )
                      }
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2"
                    >
                      <option value="PENDING">
                        PENDING
                      </option>

                      <option value="ACCEPTED">
                        ACCEPTED
                      </option>

                      <option value="EXPIRED">
                        EXPIRED
                      </option>
                    </select>
                  </td>

                  <td className="p-4">
                    {new Date(
                      item.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() =>
                        setDeleteId(item.id)
                      }
                      className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {invites.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="p-6 text-center text-zinc-400"
                  >
                    No invites found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[400px]">
              <h2 className="text-2xl font-bold mb-3">
                Hapus Email Invite?
              </h2>

              <p className="text-zinc-400 mb-6">
                Email customer ini akan dihapus secara permanen.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
                >
                  Batal
                </button>

                <button
  onClick={confirmDeleteInvite}
  disabled={deleteLoading}
  className="bg-red-500 hover:bg-red-400 disabled:opacity-50 px-4 py-2 rounded-lg"
>
  {deleteLoading
    ? "Deleting..."
    : "Hapus"}
</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}