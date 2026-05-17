import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders");
      setOrders(response.data);
    } catch {
      toast.error("Gagal mengambil orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get("/orders");

        if (isMounted) {
          setOrders(response.data);
        }
      } catch {
        if (isMounted) {
          toast.error("Gagal mengambil orders");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    const interval = setInterval(loadOrders, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const approveOrder = async (id) => {
    try {
      setLoading(true);
      await api.put(`/orders/${id}/approve`);
      toast.success("Order berhasil di-approve");
      fetchOrders();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal approve order"
      );
    } finally {
      setLoading(false);
    }
  };

  const rejectOrder = async (id) => {
    try {
      setLoading(true);
      await api.put(`/orders/${id}/reject`);
      toast.success("Order berhasil ditolak");
      fetchOrders();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal reject order"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const keyword = search.toLowerCase();

    const matchSearch =
      order.customerName
        ?.toLowerCase()
        .includes(keyword) ||
      order.customerEmail
        ?.toLowerCase()
        .includes(keyword) ||
      order.customerPhone
        ?.toLowerCase()
        .includes(keyword) ||
      order.invoice
        ?.toLowerCase()
        .includes(keyword) ||
      order.product?.name
        ?.toLowerCase()
        .includes(keyword);

    const matchStatus =
      statusFilter === "ALL"
        ? true
        : order.status === statusFilter;

    const createdAt = new Date(order.createdAt);
    const matchDateFrom = dateFrom
      ? createdAt >= new Date(`${dateFrom}T00:00:00`)
      : true;
    const matchDateTo = dateTo
      ? createdAt <= new Date(`${dateTo}T23:59:59`)
      : true;

    return matchSearch && matchStatus && matchDateFrom && matchDateTo;
  });

  const exportRows = filteredOrders.map((order) => ({
    Invoice: order.invoice,
    Tanggal: new Date(order.createdAt).toLocaleString("id-ID"),
    Customer: order.customerName,
    WhatsApp: order.customerPhone,
    Email: order.customerEmail,
    Produk: order.product?.name || "-",
    Durasi: order.product?.duration || "-",
    Plan: order.product?.plan || "-",
    Total: order.totalPrice,
    Status: order.status,
  }));

  const exportCsv = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportXls = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders.xlsx");
  };

  const exportPdf = () => {
    const document = new jsPDF({ orientation: "landscape" });
    document.text("Orders", 14, 14);
    autoTable(document, {
      startY: 20,
      head: [Object.keys(exportRows[0] || { Invoice: "" })],
      body: exportRows.map((row) => Object.values(row)),
      styles: {
        fontSize: 8,
      },
    });
    document.save("orders.pdf");
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusBadge = (status) => {
    if (status === "COMPLETED") {
      return "bg-green-500/20 text-green-400";
    }

    if (status === "REJECTED") {
      return "bg-red-500/20 text-red-400";
    }

    if (status === "CANCELLED") {
      return "bg-zinc-500/20 text-zinc-400";
    }

    if (status === "WAITING_CONFIRMATION") {
      return "bg-blue-500/20 text-blue-400";
    }

    return "bg-yellow-500/20 text-yellow-400";
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Orders
      </h1>

      <div className="grid gap-5 mb-8 sm:grid-cols-2 xl:grid-cols-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Total Orders</p>
          <h2 className="text-2xl font-bold mt-2">
            {orders.length}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Pending</p>
          <h2 className="text-2xl font-bold mt-2 text-yellow-400">
            {orders.filter((o) => o.status === "PENDING").length}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Waiting</p>
          <h2 className="text-2xl font-bold mt-2 text-blue-400">
            {
              orders.filter(
                (o) =>
                  o.status ===
                  "WAITING_CONFIRMATION"
              ).length
            }
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Completed</p>
          <h2 className="text-2xl font-bold mt-2 text-green-400">
            {
              orders.filter(
                (o) => o.status === "COMPLETED"
              ).length
            }
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Rejected</p>
          <h2 className="text-2xl font-bold mt-2 text-red-400">
            {
              orders.filter(
                (o) => o.status === "REJECTED"
              ).length
            }
          </h2>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-col sm:flex-row sm:flex-wrap">
        <input
          type="text"
          placeholder="Cari invoice / customer / product..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 w-full sm:w-80"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }
          }
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">PENDING</option>
          <option value="WAITING_CONFIRMATION">
            WAITING_CONFIRMATION
          </option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
        />

        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredOrders.length === 0}
            className="rounded-xl border border-[#d5a756]/25 px-4 py-3 font-bold text-[#f0cf87] disabled:opacity-40"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={exportXls}
            disabled={filteredOrders.length === 0}
            className="rounded-xl border border-[#d5a756]/25 px-4 py-3 font-bold text-[#f0cf87] disabled:opacity-40"
          >
            XLS
          </button>
          <button
            type="button"
            onClick={exportPdf}
            disabled={filteredOrders.length === 0}
            className="rounded-xl border border-[#d5a756]/25 px-4 py-3 font-bold text-[#f0cf87] disabled:opacity-40"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Invoice</th>
              <th className="text-left p-4">Tanggal</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Target Email</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Payment</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && orders.length === 0 ? (
              [...Array(5)].map((_, index) => (
                <tr
                  key={index}
                  className="border-t border-zinc-800 animate-pulse"
                >
                  {[...Array(9)].map((_, col) => (
                    <td key={col} className="p-4">
                      <div className="h-5 bg-zinc-800 rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-zinc-800"
                  >
                    <td className="p-4">
                      <p className="font-bold text-[#f0cf87]">
                        {order.invoice}
                      </p>
                      <p className="text-xs text-zinc-500">
                        #{order.id}
                      </p>
                    </td>

                    <td className="p-4 text-sm text-zinc-300">
                      {new Date(order.createdAt).toLocaleString("id-ID")}
                    </td>

                    <td className="p-4">
                      <p className="font-semibold">
                        {order.customerName}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {order.customerPhone}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {order.customerEmail}
                      </p>
                    </td>

                    <td className="p-4">
                      <p>{order.product?.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-cyan-400">
                          {order.product?.duration || "-"}
                        </span>
                        <span className="text-xs text-emerald-400">
                          {order.product?.plan || "-"}
                        </span>
                        <span className="text-xs text-indigo-400">
                          {order.product?.deliveryType}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      {order.targetEmail || "-"}
                    </td>

                    <td className="p-4">
                      Rp{" "}
                      {order.totalPrice.toLocaleString()}
                    </td>

                    <td className="p-4">
                      {order.paymentProof ? (
                        <img
                          src={order.paymentProof}
                          alt="payment"
                          onClick={() =>
                            window.open(
                              order.paymentProof
                            )
                          }
                          className="w-20 h-20 object-cover rounded-xl border border-zinc-700 cursor-pointer hover:opacity-80"
                        />
                      ) : (
                        <span className="text-zinc-500">
                          Belum ada
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm ${statusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="p-4">
                      {order.status ===
                      "WAITING_CONFIRMATION" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              approveOrder(order.id)
                            }
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-2 rounded-lg"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              rejectOrder(order.id)
                            }
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-2 rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-500">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-10 text-center text-zinc-400"
                    >
                      Belum ada order
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm text-zinc-400">Show:</span>
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
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="truncate text-xs text-zinc-500">
            {filteredOrders.length} data
          </span>
        </div>

        <p className="text-sm text-zinc-400">
          Page {currentPage} of {totalPages || 1}
        </p>

        <div className="flex min-w-0 gap-2">
          <button
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            className="h-9 rounded-lg bg-zinc-800 px-3 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <button
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages || 1))
            }
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-9 rounded-lg bg-zinc-800 px-3 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
