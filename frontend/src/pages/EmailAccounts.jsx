import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api";

import InviteModal from "../components/InviteModal";
import {
  exportRowsToPdf,
  exportRowsToXlsx,
} from "../utils/exportFiles";

const parseImportLine = (line) => {
  const delimiter = line.includes("\t")
    ? "\t"
    : line.includes(";")
    ? ";"
    : ",";
  const values = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
};

export default function EmailAccounts() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] =
    useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");
  const [bulkText, setBulkText] = 
    useState("");
  const [currentPage, setCurrentPage] =
    useState(1);
  const [deleteId, setDeleteId] =
    useState(null);
  const [loading, setLoading] =
    useState(false);
  const [editData, setEditData] =
    useState(null);
  const [showPassword, setShowPassword] =
    useState({});
  const [openActionId, setOpenActionId] =
    useState(null);
  const [selectedIds, setSelectedIds] =
    useState([]);
  const [fetchLoading, setFetchLoading] =
    useState(true);
  const [defaultFamilySlot, setDefaultFamilySlot] =
    useState(5);
  const [openExport, setOpenExport] =
    useState(false);

  const [itemsPerPage, setItemsPerPage] =
  useState(10);

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [form, setForm] = useState({
    serviceName: "",
    duration: "",
    plan: "",
    email: "",
    password: "",
    recovery: "",
    status: "BELUM_DIGUNAKAN",
    familySlot: defaultFamilySlot,
  });

  const [actionPosition, setActionPosition] =
  useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const loadEmails = async () => {
      try {
        setFetchLoading(true);

        const response = await api.get("/emails", {
          params: {
            search: debouncedSearch,
            status: statusFilter,
          },
        });

        if (isMounted) {
          setEmails(response.data);
        }
      } catch {
        if (isMounted) {
          toast.error("Gagal mengambil data email");
        }
      } finally {
        if (isMounted) {
          setFetchLoading(false);
        }
      }
    };

    loadEmails();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 500);
  return () => clearTimeout(timer);
  } , [search]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await api.get("/settings");

        if (!isMounted) {
          return;
        }

        setDefaultFamilySlot(
          response.data.defaultFamilySlot
        );

        setForm((prev) => ({
          ...prev,
          familySlot:
            response.data.defaultFamilySlot,
        }));
      } catch {
        console.log("Settings tidak ditemukan");
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchEmails = async () => {
  try {
    setFetchLoading(true);

    const response = await api.get("/emails", {
      params: {
        search: debouncedSearch,
        status: statusFilter,
      },
    });

    setEmails(response.data);
  } catch {
    toast.error("Gagal mengambil data email");
  } finally {
    setFetchLoading(false);
  }
};

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const addEmail = async () => {
    if (
  !form.serviceName ||
  !form.duration ||
  !form.plan ||
  !form.email ||
  !form.password
) {
  toast.error("Nama layanan, durasi, plan, email, dan password wajib diisi");
  return;
}

    try {
      setLoading(true);

      await api.post("/emails", form);

      toast.success("Email berhasil ditambahkan");

      fetchEmails();

      setForm({
        serviceName: "",
        duration: "",
        plan: "",
        email: "",
        password: "",
        recovery: "",
        status: "BELUM_DIGUNAKAN",
        familySlot: defaultFamilySlot,
      });
    } catch {
      toast.error("Gagal menambahkan email");
    } finally {
      setLoading(false);
    }
  };

  const bulkImportEmails = async () => {
  if (!bulkText.trim()) {
    toast.error("Data bulk import masih kosong");
    return;
  }

  try {
    setLoading(true);

    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "")
      .filter((line, index) => {
        if (index !== 0) {
          return true;
        }

        const normalized = line.toLowerCase();
        return !(
          normalized.includes("servicename") ||
          normalized.includes("nama layanan")
        );
      });

    const emails = lines.map((line, index) => {

      const parts = parseImportLine(line);

      if (parts.length < 5) {
        throw new Error(
          `Format salah di baris ${index + 1}`
        );
      }

      const [
        serviceName,
        duration,
        plan,
        email,
        password,
        recovery = "",
        familySlot = "",
      ] = parts;

      if (!serviceName?.trim()) {
        throw new Error(
          `Nama layanan kosong di baris ${index + 1}`
        );
      }

      if (!duration?.trim()) {
        throw new Error(
          `Durasi kosong di baris ${index + 1}`
        );
      }

      if (!plan?.trim()) {
        throw new Error(
          `Plan kosong di baris ${index + 1}`
        );
      }

      if (!email?.trim()) {
        throw new Error(
          `Email kosong di baris ${index + 1}`
        );
      }

      if (!password?.trim()) {
        throw new Error(
          `Password kosong di baris ${index + 1}`
        );
      }

      if (
        familySlot &&
        isNaN(Number(familySlot))
      ) {
        throw new Error(
          `Family slot harus angka di baris ${
            index + 1
          }`
        );
      }

      return {
  serviceName: serviceName.trim(),
  duration: duration?.trim() || "",
  plan: plan?.trim() || "",
  email: email.trim(),
  password: password.trim(),
  recovery: recovery?.trim() || "",
  familySlot:
    Number(familySlot) ||
    defaultFamilySlot,
};
    });

    await api.post("/emails/bulk", {
      emails,
    });

    toast.success(
      "Bulk email berhasil diimport"
    );

    setBulkText("");
    fetchEmails();
    setCurrentPage(1);

  } catch (error) {

    toast.error(
      error.message ||
        "Gagal import bulk email"
    );

  } finally {

    setLoading(false);

  }
};

  const exportEmailCSV = async () => {
    try {
      const response = await api.get(
        "/emails/export/csv",
        {
          responseType: "blob",
        }
      );

      const url =
        window.URL.createObjectURL(
          new Blob([response.data])
        );

      const link =
        document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        "email-accounts.csv"
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("CSV berhasil di-export");
    } catch {
      toast.error("Gagal export CSV");
    }
  };

  const exportEmailExcel = async () => {
  const data = emails.map((item) => ({
    Email: item.email,
    Layanan: item.serviceName,
    Durasi: item.duration || "-",
    Plan: item.plan || "-",
    Password: item.password,
    Recovery: item.recovery || "-",
    Status: item.status,
    "Slot Used":
      item.invites?.filter((invite) =>
        ["PENDING", "ACCEPTED"].includes(
          invite.status
        )
      ).length || 0,
    "Family Slot": item.familySlot,
    "Created At": new Date(
      item.createdAt
    ).toLocaleDateString(),
  }));

  await exportRowsToXlsx(data, "email-accounts.xlsx", "Email Accounts");
  toast.success("Excel berhasil di-export");
};

const exportEmailPDF = async () => {
  await exportRowsToPdf({
    title: "Laporan Email Accounts",
    headers: [
      "Email",
      "Layanan",
      "Durasi",
      "Plan",
      "Password",
      "Recovery",
      "Status",
      "Slot",
      "Created At",
    ],
    rows: emails.map((item) => [
      item.email,
      item.serviceName,
      item.duration || "-",
      item.plan || "-",
      item.password,
      item.recovery || "-",
      item.status,
      `${
        item.invites?.filter((invite) =>
          ["PENDING", "ACCEPTED"].includes(
            invite.status
          )
        ).length || 0
      } / ${item.familySlot}`,
      new Date(item.createdAt).toLocaleDateString(),
    ]),
    filename: "email-accounts.pdf",
  });
  toast.success("PDF berhasil di-export");
};

  const confirmDeleteEmail = async () => {
    try {
      await api.delete(`/emails/${deleteId}`);

      toast.success("Email berhasil dihapus");

      setDeleteId(null);
      fetchEmails();
    } catch {
      toast.error("Gagal menghapus email");
    }
  };

  const bulkDeleteEmails = async () => {
  if (selectedIds.length === 0) {
    toast.error("Pilih email dulu");
    return;
  }

  setDeleteId("bulk");
};

const bulkUpdateStatus = async (status) => {
  if (selectedIds.length === 0) {
    toast.error("Pilih email dulu");
    return;
  }

  try {
    setLoading(true);

    await api.put("/emails/bulk-status", {
      ids: selectedIds,
      status,
    });

    setEmails((prev) =>
      prev.map((item) =>
        selectedIds.includes(item.id)
          ? {
              ...item,
              status,
            }
          : item
      )
    );

    toast.success("Status berhasil diubah");

    setSelectedIds([]);
  } catch {
    toast.error("Gagal update status");
  } finally {
    setLoading(false);
  }
};

const confirmBulkDeleteEmails = async () => {
  try {
    setLoading(true);

    await api.delete("/emails/bulk-delete", {
      data: {
        ids: selectedIds,
      },
    });

    toast.success("Email terpilih berhasil dihapus");

    setSelectedIds([]);
    setDeleteId(null);
    fetchEmails();
  } catch {
    toast.error("Gagal menghapus email terpilih");
  } finally {
    setLoading(false);
  }
};

  const updateStatus = async (id, status) => {
  try {
    await api.put(`/emails/${id}`, {
      status,
    });

    setEmails((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
            }
          : item
      )
    );

    toast.success("Status berhasil diubah");
  } catch {
    toast.error("Gagal mengubah status");
  }
};

  const updateEmail = async () => {
    if (
      !editData.serviceName ||
      !editData.duration ||
      !editData.plan ||
      !editData.email ||
      !editData.password
    ) {
      toast.error("Nama layanan, durasi, plan, email, dan password wajib diisi");
      return;
    }

    try {
      setLoading(true);

      await api.put(`/emails/${editData.id}`, {
        serviceName: editData.serviceName,
        duration: editData.duration,
        plan: editData.plan,
        email: editData.email,
        password: editData.password,
        recovery: editData.recovery,
        status: editData.status,
        familySlot: Number(editData.familySlot),
      });

      toast.success("Email berhasil diupdate");

      setEditData(null);
      fetchEmails();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal update email"
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(
    emails.length / itemsPerPage
  );

  const paginatedEmails = emails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Stok Akun Email
        </h1>

        
      </div>

      <div className="mb-8 max-w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-xl font-semibold mb-5">
          Tambah Akun Email
        </h2>

        <div className="grid grid-cols-2 gap-5">
          <input
  type="text"
  name="serviceName"
  placeholder="Nama Layanan"
  value={form.serviceName}
  onChange={handleChange}
  className="bg-zinc-800 border border-zinc-700 rounded-xl p-4"
/>

          <select
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          >
            <option value="">Pilih durasi</option>
            <option value="1 Hari">1 Hari</option>
            <option value="7 Hari">7 Hari</option>
            <option value="1 Bulan">1 Bulan</option>
            <option value="3 Bulan">3 Bulan</option>
            <option value="1 Tahun">1 Tahun</option>
          </select>

          <select
            name="plan"
            value={form.plan}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          >
            <option value="">Pilih plan</option>
            <option value="1P1U">1P1U</option>
            <option value="1P2U">1P2U</option>
            <option value="1P3U">1P3U</option>
            <option value="Private">Private</option>
            <option value="Sharing">Sharing</option>
          </select>

          <input
            type="text"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <input
            type="text"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <input
            type="text"
            name="recovery"
            placeholder="Recovery Email"
            value={form.recovery}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <input
            type="number"
            name="familySlot"
            placeholder="Family Slot"
            value={form.familySlot}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />
        </div>

        <button
          onClick={addEmail}
          disabled={loading}
          className="mt-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-3 rounded-xl"
        >
          {loading ? "Loading..." : "Tambah Email"}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Bulk Import Emails
        </h2>

        <p className="mb-4 max-w-full break-words text-sm leading-6 text-zinc-400">
          Format: serviceName, duration, plan, email, password, recovery(optional), familySlot(optional). Bisa pakai koma, titik koma, atau tab.
        </p>

        <textarea
          value={bulkText}
          onChange={(e) =>
            setBulkText(e.target.value)
          }
          placeholder="Service Name, Duration, Plan, Email, Password, Recovery Email(optional), Family Slot(optional)"
          className="h-40 w-full max-w-full resize-y rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm leading-6"
        />

        <button
          onClick={bulkImportEmails}
          disabled={loading}
          className="mt-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-3 rounded-xl"
        >
          {loading ? "Importing..." : "Import Emails"}
        </button>
      </div>

      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-start">

  {/* LEFT */}
  <div className="grid gap-3 sm:grid-cols-2">
    <input
      type="text"
      placeholder="Search email..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
      }}
      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4"
    />

    <select
      value={statusFilter}
      onChange={(e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
      }}
      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4"
    >
      <option value="ALL">
        All Status
      </option>

      <option value="BELUM_DIGUNAKAN">
        BELUM DIGUNAKAN
      </option>

      <option value="SUDAH_DIGUNAKAN">
        SUDAH DIGUNAKAN
      </option>

      <option value="TERJUAL">
        FULL
      </option>

      <option value="ERROR">
        ERROR
      </option>
    </select>
  </div>

  {/* RIGHT */}
  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">

    {selectedIds.length > 0 && (
      <select
        onChange={(e) => {
          if (e.target.value) {
            bulkUpdateStatus(e.target.value);
          }
        }}
        className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
        defaultValue=""
      >
        <option value="" disabled>
          Ubah Status
        </option>

        <option value="BELUM_DIGUNAKAN">
          BELUM DIGUNAKAN
        </option>

        <option value="SUDAH_DIGUNAKAN">
          SUDAH DIGUNAKAN
        </option>

        <option value="TERJUAL">
          FULL
        </option>

        <option value="ERROR">
          ERROR
        </option>
      </select>
    )}

    {user?.role === "ADMIN" &&
      selectedIds.length > 0 && (
        <button
          onClick={bulkDeleteEmails}
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 px-5 py-3 rounded-xl transition"
        >
          Hapus ({selectedIds.length})
        </button>
      )}

    {user?.role === "ADMIN" && (
  <div className="relative">
    <button
      onClick={() =>
        setOpenExport(!openExport)
      }
      className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl transition"
    >
      EXPORT
    </button>

    {openExport && (
      <div className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50">

        <button
  onClick={() => {
    exportEmailCSV();
    setOpenExport(false);
  }}
  className="w-full text-left px-4 py-3 hover:bg-zinc-800"
>
  Export CSV
</button>

<button
  onClick={() => {
    exportEmailPDF();
    setOpenExport(false);
  }}
  className="w-full text-left px-4 py-3 hover:bg-zinc-800"
>
  Export PDF
</button>

<button
  onClick={() => {
    exportEmailExcel();
    setOpenExport(false);
  }}
  className="w-full text-left px-4 py-3 hover:bg-zinc-800"
>
  Export Excel
</button>

      </div>
    )}
  </div>
)}
  </div>
</div>

          <div className="grid gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-5">
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
    <p className="text-zinc-400 text-sm">
      Total Email
    </p>

    <h2 className="text-2xl font-bold mt-2">
      {emails.length}
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
    <p className="text-zinc-400 text-sm">
      Belum Digunakan
    </p>

    <h2 className="text-2xl font-bold mt-2 text-white">
      {
        emails.filter(
          (item) =>
            item.status ===
            "BELUM_DIGUNAKAN"
        ).length
      }
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
    <p className="text-zinc-400 text-sm">
      Sudah Digunakan
    </p>

    <h2 className="text-2xl font-bold mt-2 text-yellow-400">
      {
        emails.filter(
          (item) =>
            item.status ===
            "SUDAH_DIGUNAKAN"
        ).length
      }
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
    <p className="text-zinc-400 text-sm">
      Full
    </p>

    <h2 className="text-2xl font-bold mt-2 text-green-400">
      {
        emails.filter(
          (item) =>
            item.status ===
            "TERJUAL"
        ).length
      }
    </h2>
  </div>

  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
    <p className="text-zinc-400 text-sm">
      Error
    </p>

    <h2 className="text-2xl font-bold mt-2 text-red-400">
      {
        emails.filter(
          (item) =>
            item.status === "ERROR"
        ).length
      }
    </h2>
  </div>
</div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
  <tr>
    {user?.role === "ADMIN" && (
    <th className="text-left p-4 w-12">
      <input
        type="checkbox"
        checked={
          paginatedEmails.length > 0 &&
          paginatedEmails.every((item) =>
            selectedIds.includes(item.id)
          )
        }
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedIds(
              paginatedEmails.map((item) => item.id)
            );
          } else {
            setSelectedIds([]);
          }
        }}
      />
    </th>
    )}

    <th className="text-left p-4">
  Layanan
</th>

    <th className="text-left p-4">
      Durasi
    </th>

    <th className="text-left p-4">
      Plan
    </th>

    <th className="text-left p-4">
      Email
    </th>

    <th className="text-left p-4">
      Password
    </th>

    <th className="text-left p-4">
      Status
    </th>

    <th className="text-left p-4">
      Recovery
    </th>

    <th className="text-left p-4">
      Slot
    </th>

    <th className="text-left p-4">
      Action
    </th>
  </tr>
</thead>

          <tbody>
  {fetchLoading ? (
    [...Array(6)].map((_, index) => (
      <tr
        key={index}
        className="border-t border-zinc-800 animate-pulse"
      >
        {[...Array(user?.role === "ADMIN" ? 10 : 9)].map((_, colIndex) => (
          <td key={colIndex} className="p-4">
            <div className="h-5 bg-zinc-800 rounded-lg" />
          </td>
        ))}
      </tr>
    ))
  ) : (
    <>
      {paginatedEmails.map((item) => (
        <tr
          key={item.id}
          className="border-t border-zinc-800"
        >
          {user?.role === "ADMIN" && (
          <td className="p-4">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds([
                    ...selectedIds,
                    item.id,
                  ]);
                } else {
                  setSelectedIds(
                    selectedIds.filter(
                      (id) => id !== item.id
                    )
                  );
                }
              }}
            />
          </td>
          )}

          <td className="p-4">
  <span className="bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-lg text-sm">
    {item.serviceName}
  </span>
</td>

          <td className="p-4">
            <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-lg text-sm">
              {item.duration || "-"}
            </span>
          </td>

          <td className="p-4">
            <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg text-sm">
              {item.plan || "-"}
            </span>
          </td>

          <td className="p-4">
            {item.email}
          </td>

          <td className="p-4">
            <div className="flex items-center gap-3">
              <span>
                {showPassword[item.id]
                  ? item.password
                  : "••••••••"}
              </span>

              <button
                onClick={() => {
                  setShowPassword({
                    ...showPassword,
                    [item.id]:
                      !showPassword[item.id],
                  });

                  if (!showPassword[item.id]) {
                    setTimeout(() => {
                      setShowPassword((prev) => ({
                        ...prev,
                        [item.id]: false,
                      }));
                    }, 5000);
                  }
                }}
                className="text-zinc-400 hover:text-white"
              >
                👁
              </button>
            </div>
          </td>

          <td className="p-4">
            <select
              value={item.status}
              onChange={(e) =>
                updateStatus(
                  item.id,
                  e.target.value
                )
              }
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
            >
              <option value="BELUM_DIGUNAKAN">
                BELUM DIGUNAKAN
              </option>
              <option value="SUDAH_DIGUNAKAN">
                SUDAH DIGUNAKAN
              </option>
              <option value="TERJUAL">
                FULL
              </option>
              <option value="ERROR">
                ERROR
              </option>
            </select>
          </td>

          <td className="p-4">
            {item.recovery}
          </td>

          <td className="p-4">
            {item.invites?.filter((invite) =>
              ["PENDING", "ACCEPTED"].includes(
                invite.status
              )
            ).length || 0}{" "}
            / {item.familySlot}
          </td>

          <td className="p-4">
            <div className="relative">
              <button
  onClick={(e) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const dropdownHeight = 360;

    const shouldOpenUp =
      rect.bottom + dropdownHeight >
      window.innerHeight;

    setActionPosition({
      top: shouldOpenUp
        ? rect.top - dropdownHeight - 8
        : rect.bottom + 8,
      left: rect.right - 192,
    });

    setOpenActionId(
      openActionId === item.id
        ? null
        : item.id
    );
  }}
  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
>
  Action
</button>

              {openActionId && (
                <div
                  onClick={() =>
                    setOpenActionId(null)
                  }
                  className="fixed inset-0 z-40"
                />
              )}

              {openActionId === item.id && (
  <div
    style={{
      top: actionPosition.top,
      left: actionPosition.left,
    }}
    className="fixed z-[9999] w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
  >
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Layanan: ${item.serviceName}\nDurasi: ${item.duration || "-"}\nPlan: ${item.plan || "-"}\nEmail: ${item.email}\nPassword: ${item.password}\nRecovery: ${item.recovery || "-"}`
                      );
                      toast.success(
                        "Data akun berhasil disalin"
                      );
                      setOpenActionId(null);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-800"
                  >
                    Salin Semua
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        item.email
                      );
                      toast.success(
                        "Email berhasil dicopy"
                      );
                      setOpenActionId(null);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-800"
                  >
                    Salin Email
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        item.password
                      );
                      toast.success(
                        "Password berhasil dicopy"
                      );
                      setOpenActionId(null);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-800"
                  >
                    Salin Password
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEmail(item);
                      setOpenActionId(null);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-800"
                  >
                    Kelola Invite
                  </button>

                  <button
                    onClick={() => {
                      setEditData(item);
                      setOpenActionId(null);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-yellow-400"
                  >
                    Edit
                  </button>

                  {user?.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        setDeleteId(item.id);
                        setOpenActionId(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-red-400"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      ))}

      {paginatedEmails.length === 0 && (
        <tr>
          <td
            colSpan={user?.role === "ADMIN" ? 10 : 9}
            className="p-10 text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="text-5xl">
                📭
              </div>

              <h3 className="text-lg font-semibold text-white">
                Tidak ada email
              </h3>

              <p className="text-zinc-400">
                Coba ubah filter atau tambahkan akun email baru
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
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
      setItemsPerPage(
        Number(e.target.value)
      );

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
          Page {currentPage} of{" "}
          {totalPages || 1}
        </p>

        <div className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1">

  <button
    onClick={() =>
      setCurrentPage(currentPage - 1)
    }
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
        onClick={() =>
          setCurrentPage(page)
        }
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
    onClick={() =>
      setCurrentPage(currentPage + 1)
    }
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

      {editData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[600px]">
            <h2 className="text-2xl font-bold mb-5">
              Edit Akun Email
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="serviceName"
                placeholder="Nama Layanan"
                value={editData.serviceName || ""}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <select
                name="duration"
                value={editData.duration || ""}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              >
                <option value="">Pilih durasi</option>
                <option value="1 Hari">1 Hari</option>
                <option value="7 Hari">7 Hari</option>
                <option value="1 Bulan">1 Bulan</option>
                <option value="3 Bulan">3 Bulan</option>
                <option value="1 Tahun">1 Tahun</option>
              </select>

              <select
                name="plan"
                value={editData.plan || ""}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              >
                <option value="">Pilih plan</option>
                <option value="1P1U">1P1U</option>
                <option value="1P2U">1P2U</option>
                <option value="1P3U">1P3U</option>
                <option value="Private">Private</option>
                <option value="Sharing">Sharing</option>
              </select>

              <input
                type="text"
                name="email"
                placeholder="Email"
                value={editData.email}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <input
                type="text"
                name="password"
                placeholder="Password"
                value={editData.password}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <input
                type="text"
                name="recovery"
                placeholder="Recovery Email"
                value={editData.recovery || ""}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <input
                type="number"
                name="familySlot"
                placeholder="Family Slot"
                value={editData.familySlot}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <select
                name="status"
                value={editData.status}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 col-span-2"
              >
                <option value="BELUM_DIGUNAKAN">
                  BELUM DIGUNAKAN
                </option>
                <option value="SUDAH_DIGUNAKAN">
                  SUDAH DIGUNAKAN
                </option>
                <option value="TERJUAL">
                  FULL
                </option>
                <option value="ERROR">
                  ERROR
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditData(null)}
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={updateEmail}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 px-4 py-2 rounded-lg text-black"
              >
                {loading ? "Saving..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[400px]">
      <h2 className="text-2xl font-bold mb-3">
        {deleteId === "bulk"
          ? "Hapus Email Terpilih?"
          : "Hapus Email?"}
      </h2>

      <p className="text-zinc-400 mb-6">
        {deleteId === "bulk"
          ? `${selectedIds.length} email akan dihapus secara permanen.`
          : "Data email ini dan semua invite di dalamnya akan dihapus permanen."}
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setDeleteId(null)}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
        >
          Batal
        </button>

        <button
          onClick={
            deleteId === "bulk"
              ? confirmBulkDeleteEmails
              : confirmDeleteEmail
          }
          disabled={loading}
          className="bg-red-500 hover:bg-red-400 disabled:opacity-50 px-4 py-2 rounded-lg"
        >
          {loading ? "Deleting..." : "Hapus"}
        </button>
      </div>
    </div>
  </div>
)}

      {selectedEmail && (
        <InviteModal
          selectedEmail={selectedEmail}
          onClose={() => {
            setSelectedEmail(null);
            fetchEmails();
          }}
        />
      )}
    </div>
  );
}
