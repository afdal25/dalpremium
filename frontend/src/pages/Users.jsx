import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { AUTH_API_PREFIX } from "../config/routes";

export default function Users() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const response = await api.get("/users");

        if (isMounted) {
          setUsers(response.data);
        }
      } catch {
        toast.error("Gagal mengambil user");
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch {
      toast.error("Gagal mengambil user");
    }
  };

  const addStaff = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Semua field wajib diisi");
      return;
    }

    try {
      setLoading(true);
      await api.post(
        `${AUTH_API_PREFIX}/create-staff`,
        form
      );

      toast.success("Staff berhasil dibuat");

      setForm({
        name: "",
        email: "",
        password: "",
      });

      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal membuat staff"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () => {
    try {
      setLoading(true);

      await api.delete(`/users/${deleteId}`);

      toast.success("User berhasil dihapus");
      setDeleteId(null);
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menghapus user"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      user.email
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(
    filteredUsers.length / itemsPerPage
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Kelola Pengguna
      </h1>

      <input
        type="text"
        placeholder="Search user..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 w-80 mb-6"
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xl mb-8">
        <h2 className="text-xl font-semibold mb-5">
          Tambah Staff
        </h2>

        <div className="space-y-4">
          <input
            name="name"
            placeholder="Nama..."
            value={form.name}
            onChange={handleChange}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <input
            name="email"
            placeholder="Email..."
            value={form.email}
            onChange={handleChange}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <input
            name="password"
            type="password"
            placeholder="Password..."
            value={form.password}
            onChange={handleChange}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <button
            onClick={addStaff}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-3 rounded-xl"
          >
            {loading ? "Loading..." : "Tambahkan"}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Nama</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Tanggal</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((user) => (
              <tr
                key={user.id}
                className="border-t border-zinc-800"
              >
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm ${
                      user.role === "ADMIN"
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>

                <td className="p-4">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                <td className="p-4">
                  {user.role !== "ADMIN" ? (
                    <button
                      onClick={() => setDeleteId(user.id)}
                      className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg"
                    >
                      Hapus
                    </button>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="p-8 text-center text-zinc-400"
                >
                  Belum ada user
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm text-zinc-400">
            Show:
          </span>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-zinc-800 bg-black px-2 text-sm"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={1000}>1000</option>
          </select>
        </div>

        <p className="text-sm text-zinc-400">
          Page {currentPage} of {totalPages || 1}
        </p>

        <div className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 shrink-0 rounded-lg bg-zinc-800 px-3 text-sm hover:bg-zinc-700 disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-9 min-w-9 shrink-0 rounded-lg px-2 text-sm transition ${
                  currentPage === page
                    ? "bg-indigo-600"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            className="h-9 shrink-0 rounded-lg bg-zinc-800 px-3 text-sm hover:bg-zinc-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[400px]">
            <h2 className="text-2xl font-bold mb-3">
              Hapus User?
            </h2>

            <p className="text-zinc-400 mb-6">
              User ini akan dihapus secara permanen.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={deleteUser}
                disabled={loading}
                className="bg-red-500 hover:bg-red-400 disabled:opacity-50 px-4 py-2 rounded-lg"
              >
                {loading ? "Deleting..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
