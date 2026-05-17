import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api";
import {
  exportRowsToPdf,
  exportRowsToXlsx,
} from "../utils/exportFiles";

export default function Transactions() {
  const [transactions, setTransactions] =
    useState([]);

  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    profit: 0,
  });

  const [search, setSearch] = 
    useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");
  const [typeFilter, setTypeFilter] =
    useState("ALL");
  const [startDate, setStartDate] =
    useState("");
  const [endDate, setEndDate] =
    useState("");
  const [sortBy, setSortBy] =
    useState("newest");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [deleteId, setDeleteId] =
    useState(null);
  const [editData, setEditData] =
    useState(null);

  const [addLoading, setAddLoading] =
    useState(false);
  const [deleteLoading, setDeleteLoading] =
    useState(false);
  const [exportLoading, setExportLoading] =
    useState(false);
  const [openActionId, setOpenActionId] =
    useState(null);
    const [actionPosition, setActionPosition] =
  useState({ top: 0, left: 0,});
  const [fetchLoading, setFetchLoading] =
    useState(true);
  const [currency, setCurrency] =
    useState("Rp");
  const [openExport, setOpenExport] =
    useState(false);

  const [itemsPerPage, setItemsPerPage] =
  useState(10);

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [form, setForm] = useState({
    type: "PENDAPATAN",
    amount: "",
    description: "",
  });

  useEffect(() => {
  fetchTransactions();
  setCurrentPage(1);
}, [
  debouncedSearch,
  typeFilter,
  startDate,
  endDate,
  sortBy,
]);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 500);

  return () => clearTimeout(timer);
}, [search]);

useEffect(() => {
  fetchSettings();
}, []);

const fetchSettings = async () => {
  try {
    const response = await api.get(
      "/settings"
    );

    setCurrency(
      response.data.currency
    );
  } catch (error) {
    console.log(
      "Settings tidak ditemukan"
    );
  }
};

  const fetchTransactions = async () => {
  try {
    if (transactions.length === 0) {
      setFetchLoading(true);
    }

    const response =
      await api.get("/transactions", {
        params: {
          search: debouncedSearch,
          type: typeFilter,
          startDate,
          endDate,
          sortBy,
        },
      });

    setTransactions(response.data.transactions);
    setSummary(response.data.summary);
  } catch (error) {
    toast.error("Gagal mengambil transaksi");
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

  const addTransaction = async () => {
    if (!form.amount || !form.description) {
      toast.error(
        "Amount dan description wajib diisi"
      );
      return;
    }

    try {
      setAddLoading(true);

      await api.post("/transactions", {
  ...form,
  amount: Number(form.amount),
});

      toast.success(
        "Transaksi berhasil ditambahkan"
      );

      fetchTransactions();

      setForm({
        type: "PENDAPATAN",
        amount: "",
        description: "",
      });
    } catch (error) {
      toast.error("Terjadi error");
    } finally {
      setAddLoading(false);
    }
  };

  const updateTransaction = async () => {
    if (
      !editData.amount ||
      !editData.description
    ) {
      toast.error(
        "Amount dan description wajib diisi"
      );
      return;
    }

    try {
      setAddLoading(true);

      await api.put(
        `/transactions/${editData.id}`,
        {
          type: editData.type,
          amount: editData.amount,
          description: editData.description,
        }
      );

      toast.success(
        "Transaksi berhasil diupdate"
      );

      setEditData(null);
      fetchTransactions();
    } catch (error) {
      toast.error("Gagal update transaksi");
    } finally {
      setAddLoading(false);
    }
  };

  const confirmDeleteTransaction = async () => {
    try {
      setDeleteLoading(true);

      await api.delete(
        `/transactions/${deleteId}`
      );

      toast.success(
        "Transaksi berhasil dihapus"
      );

      setDeleteId(null);
      fetchTransactions();
    } catch (error) {
      toast.error(
        "Gagal menghapus transaksi"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportCSV = async () => {
  try {
    setExportLoading(true);

    const response = await api.get(
      "/transactions/export/csv",
      {
        responseType: "blob",

        params: {
          search,
          type: typeFilter,
          startDate,
          endDate,
          sortBy,
        },
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
      "transactions.csv"
    );

    document.body.appendChild(link);

    link.click();

    link.remove();

    toast.success("CSV berhasil di-export");

  } catch (error) {

    toast.error("Gagal export CSV");

  } finally {

    setExportLoading(false);

  }
};

const exportExcel = async () => {
  const data = transactions.map((item) => ({
    Type: item.type,
    Amount: item.amount,
    Description: item.description,
    Date: new Date(item.createdAt).toLocaleDateString(),
  }));

  await exportRowsToXlsx(data, "transactions.xlsx", "Transactions");
  toast.success("Excel berhasil di-export");
};

const exportPDF = async () => {
  await exportRowsToPdf({
    title: "Laporan Transaksi",
    headers: ["Type", "Amount", "Description", "Date"],
    rows: transactions.map((item) => [
      item.type,
      `${currency} ${item.amount.toLocaleString()}`,
      item.description,
      new Date(item.createdAt).toLocaleDateString(),
    ]),
    filename: "transactions.pdf",
  });
  toast.success("PDF berhasil di-export");
};

  const setTodayFilter = () => {
  const today = formatDate(new Date());

  setStartDate(today);
  setEndDate(today);
};

  const formatDate = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const setThisWeekFilter = () => {
  const now = new Date();

  const firstDay = new Date(now);

  firstDay.setDate(
    now.getDate() - now.getDay()
  );

  setStartDate(formatDate(firstDay));

  setEndDate(formatDate(now));
};

const setThisMonthFilter = () => {
  const now = new Date();

  const firstDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  setStartDate(formatDate(firstDay));

  setEndDate(formatDate(now));
};

  const resetFilter = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
    setSortBy("newest");
  };

  const totalPages = Math.ceil(
    transactions.length / itemsPerPage
  );

  const paginatedTransactions =
    transactions.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Transaksi
        </h1>

      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">
            Total Pendapatan
          </p>

          <h2 className="text-2xl font-bold mt-2 text-green-400">
            {currency} {summary.income.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">
            Total Pengeluaran
          </p>

          <h2 className="text-2xl font-bold mt-2 text-red-400">
            {currency} {summary.expense.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">
            Profit
          </p>

          <h2 className="text-2xl font-bold mt-2 text-yellow-400">
            {currency} {summary.profit.toLocaleString()}
          </h2>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
        <h2 className="text-xl font-semibold mb-5">
          Tambahkan transaksi baru
        </h2>

        <div className="grid grid-cols-3 gap-5">
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          >
            <option value="PENDAPATAN">
              PENDAPATAN
            </option>

            <option value="PENGELUARAN">
              PENGELUARAN
            </option>
          </select>

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <input
            type="text"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />
        </div>

        <button
          onClick={addTransaction}
          disabled={addLoading}
          className="mt-5 bg-green-600 hover:bg-green-500 disabled:opacity-50 px-5 py-3 rounded-xl"
        >
          {addLoading
            ? "Loading..."
            : "Tambah Transaksi"}
        </button>
      </div>

      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-start">
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
    <input
      type="text"
      placeholder="Search description..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4"
    />

    <select
      value={typeFilter}
      onChange={(e) => setTypeFilter(e.target.value)}
      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4"
    >
      <option value="ALL">All Type</option>
      <option value="PENDAPATAN">PENDAPATAN</option>
      <option value="PENGELUARAN">PENGELUARAN</option>
    </select>

    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4"
    />

    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4"
    />

    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4"
    >
      <option value="newest">Terbaru</option>
      <option value="oldest">Terlama</option>
      <option value="highest">Nominal Terbesar</option>
      <option value="lowest">Nominal Terkecil</option>
    </select>
  </div>

  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
    <button
      onClick={setTodayFilter}
      className="h-12 rounded-xl bg-zinc-800 px-3 text-sm hover:bg-zinc-700 sm:px-4"
    >
      Hari Ini
    </button>

    <button
      onClick={setThisWeekFilter}
      className="h-12 rounded-xl bg-zinc-800 px-3 text-sm hover:bg-zinc-700 sm:px-4"
    >
      Minggu Ini
    </button>

    <button
      onClick={setThisMonthFilter}
      className="h-12 rounded-xl bg-zinc-800 px-3 text-sm hover:bg-zinc-700 sm:px-4"
    >
      Bulan Ini
    </button>

    <button
      onClick={resetFilter}
      className="h-12 rounded-xl bg-zinc-800 px-3 text-sm hover:bg-zinc-700 sm:px-4"
    >
      Reset
    </button>

    {user?.role === "ADMIN" && (
  <div className="relative">
    <button
      onClick={() =>
        setOpenExport(!openExport)
      }
      className="h-12 rounded-xl bg-blue-600 px-4 text-sm hover:bg-blue-500 sm:px-5"
    >
      Export
    </button>

    {openExport && (
      <div className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50">
        
<button
  onClick={() => {
    exportCSV();
    setOpenExport(false);
  }}
  className="w-full text-left px-4 py-3 hover:bg-zinc-800"
>
  Export CSV
</button>

<button
  onClick={() => {
    exportPDF();
    setOpenExport(false);
  }}
  className="w-full text-left px-4 py-3 hover:bg-zinc-800"
>
  Export PDF
</button>

<button
  onClick={() => {
    exportExcel();
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl min-h-[600px] flex flex-col overflow-x-auto">
        <div className="flex-1">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">
                Type
              </th>

              <th className="text-left p-4">
                Amount
              </th>

              <th className="text-left p-4">
                Description
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
  {fetchLoading ? (
    [...Array(6)].map((_, index) => (
      <tr
        key={index}
        className="border-t border-zinc-800 animate-pulse"
      >
        {[...Array(5)].map((_, colIndex) => (
          <td key={colIndex} className="p-4">
            <div className="h-5 bg-zinc-800 rounded-lg" />
          </td>
        ))}
      </tr>
    ))
  ) : (
    <>
      {paginatedTransactions.map((item, index) => (
        <tr
          key={item.id}
          className="border-t border-zinc-800"
        >
          <td className="p-4">
            <span
              className={`px-3 py-1 rounded-lg text-sm ${
                item.type === "PENDAPATAN"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {item.type}
            </span>
          </td>

          <td className="p-4">
            {currency} {item.amount.toLocaleString()}
          </td>

          <td className="p-4">
            {item.description}
          </td>

          <td className="p-4">
            {new Date(
              item.createdAt
            ).toLocaleDateString()}
          </td>

          <td className="p-4">
            <div className="relative">
              <button
  onClick={(e) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const dropdownHeight = 120;

    const shouldOpenUp =
      rect.bottom + dropdownHeight >
      window.innerHeight;

    setActionPosition({
      top: shouldOpenUp
        ? rect.top - dropdownHeight - 8
        : rect.bottom + 8,
      left: rect.right - 160,
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
    className="fixed z-[9999] w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
  >
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

      {paginatedTransactions.length === 0 && (
        <tr>
          <td
            colSpan="5"
            className="p-10 text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="text-5xl">
                📭
              </div>

              <h3 className="text-lg font-semibold text-white">
                Tidak ada transaksi
              </h3>

              <p className="text-zinc-400">
                Coba ubah filter atau tambahkan transaksi baru
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[500px]">
            <h2 className="text-2xl font-bold mb-5">
              Edit Transaction
            </h2>

            <div className="space-y-4">
              <select
                name="type"
                value={editData.type}
                onChange={handleEditChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              >
                <option value="PENDAPATAN">
                  PENDAPATAN
                </option>

                <option value="PENGELUARAN">
                  PENGELUARAN
                </option>
              </select>

              <input
                type="number"
                name="amount"
                value={editData.amount}
                onChange={handleEditChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <input
                type="text"
                name="description"
                value={editData.description}
                onChange={handleEditChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() =>
                  setEditData(null)
                }
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={updateTransaction}
                disabled={addLoading}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 px-4 py-2 rounded-lg text-black"
              >
                {addLoading
                  ? "Saving..."
                  : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[400px]">
            <h2 className="text-2xl font-bold mb-3">
              Hapus Transaksi?
            </h2>

            <p className="text-zinc-400 mb-6">
              Data transaksi ini akan dihapus secara permanen.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteId(null)
                }
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={confirmDeleteTransaction}
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
  );
}
