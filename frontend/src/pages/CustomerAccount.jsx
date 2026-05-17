import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";
import { assetUrl as imageUrl } from "../utils/url";
import FilePicker from "../components/FilePicker";

const tabs = [
  "Dashboard",
  "Transaksi",
  "Mutasi",
  "Pengaturan Akun",
];

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("id-ID")
    : "-";

const statusClass = (status) => {
  if (status === "COMPLETED") {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (["REJECTED", "CANCELLED"].includes(status)) {
    return "bg-red-500/15 text-red-300";
  }

  if (status === "WAITING_CONFIRMATION") {
    return "bg-blue-500/15 text-blue-300";
  }

  return "bg-[#d5a756]/15 text-[#f0cf87]";
};

export default function CustomerAccount() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [savingPassword, setSavingPassword] =
    useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    product: "ALL",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [userResponse, ordersResponse] =
          await Promise.all([
            api.get("/customers/me"),
            api.get("/customers/orders"),
          ]);

        if (!isMounted) {
          return;
        }

        setUser(userResponse.data);
        setProfileForm({
          name: userResponse.data.name || "",
          phone: userResponse.data.phone || "",
        });
        setOrders(ordersResponse.data);
        setAllOrders(ordersResponse.data);
        localStorage.setItem(
          "customerUser",
          JSON.stringify(userResponse.data)
        );
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Gagal memuat akun"
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        const response = await api.get("/customers/orders", {
          params: filters,
        });

        if (isMounted) {
          setOrders(response.data);
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Gagal memuat transaksi"
        );
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const productOptions = useMemo(
    () => [
      "ALL",
      ...new Set(
        allOrders
          .map((order) => order.product?.name)
          .filter(Boolean)
      ),
    ],
    [allOrders]
  );

  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();

    return orders.filter(
      (order) =>
        new Date(order.createdAt).toDateString() === today
    );
  }, [orders]);

  const totalSpent = orders.reduce(
    (total, order) => total + Number(order.totalPrice || 0),
    0
  );

  const completedCount = orders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  const tableRows = orders.map((order) => ({
    invoice: order.invoice,
    tanggal: formatDate(order.createdAt),
    produk: order.product?.name || "-",
    durasi: order.product?.duration || "-",
    plan: order.product?.plan || "-",
    status: order.status,
    total: order.totalPrice,
  }));

  const mutations = allOrders.map((order) => ({
    id: order.id,
    invoice: order.invoice,
    tanggal: order.createdAt,
    deskripsi: `Pembayaran ${order.product?.name || "Produk"}`,
    metode: order.paymentProof ? "Bukti bayar terupload" : "Menunggu pembayaran",
    status: order.status,
    amount: order.totalPrice,
  }));

  const exportCsv = () => {
    const header = [
      "Invoice",
      "Tanggal",
      "Produk",
      "Durasi",
      "Plan",
      "Status",
      "Total",
    ];
    const rows = tableRows.map((row) =>
      [
        row.invoice,
        row.tanggal,
        row.produk,
        row.durasi,
        row.plan,
        row.status,
        row.total,
      ].join(",")
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "riwayat-transaksi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportXls = () => {
    const worksheet = XLSX.utils.json_to_sheet(tableRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Transaksi"
    );
    XLSX.writeFile(workbook, "riwayat-transaksi.xlsx");
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text("Riwayat Transaksi", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [
        [
          "Invoice",
          "Tanggal",
          "Produk",
          "Durasi",
          "Plan",
          "Status",
          "Total",
        ],
      ],
      body: tableRows.map((row) => [
        row.invoice,
        row.tanggal,
        row.produk,
        row.durasi,
        row.plan,
        row.status,
        formatRupiah(row.total),
      ]),
    });
    doc.save("riwayat-transaksi.pdf");
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      const formData = new FormData();
      formData.append("name", profileForm.name);
      formData.append("phone", profileForm.phone);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await api.put(
        "/customers/me",
        formData
      );

      setUser(response.data.user);
      localStorage.setItem(
        "customerUser",
        JSON.stringify(response.data.user)
      );
      setAvatarFile(null);
      toast.success("Profile berhasil diperbarui");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal memperbarui profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Semua field password wajib diisi");
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }

    try {
      setSavingPassword(true);
      await api.put("/customers/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password berhasil diganti");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal mengganti password"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0d0a] p-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="h-80 animate-pulse rounded-lg border border-[#d5a756]/15 bg-[#17130f]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#d5a756]">
              My Account
            </p>
            <h1 className="truncate text-2xl font-black sm:text-3xl">
              Halo, {user?.name}
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-3 sm:bg-transparent sm:p-0">
            <div className="h-12 w-12 overflow-hidden rounded-full border border-[#d5a756]/30 bg-[#d5a756]/15">
              {user?.avatar ? (
                <img
                  src={imageUrl(user.avatar)}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-black text-[#d5a756]">
                  {user?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 sm:hidden">
              <p className="truncate font-black">{user?.name}</p>
              <p className="truncate text-xs text-zinc-400">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="hide-scrollbar mb-6 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`h-12 shrink-0 border-b-2 px-4 text-sm font-black transition ${
                activeTab === tab
                  ? "border-[#d5a756] text-[#d5a756]"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Dashboard" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Transaksi Hari Ini" value={todayOrders.length} />
              <Stat label="Total Transaksi" value={orders.length} />
              <Stat label="Selesai" value={completedCount} />
              <Stat label="Total Belanja" value={formatRupiah(totalSpent)} />
            </div>

            <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
                <h2 className="text-xl font-black">Profile</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <Info label="Nama" value={user?.name} />
                  <Info label="Email" value={user?.email} />
                  <Info label="Nomor HP" value={user?.phone || "-"} />
                  <Info
                    label="Tanggal Bergabung"
                    value={formatDate(user?.createdAt)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
                <h2 className="text-xl font-black">
                  Riwayat Transaksi Terbaru
                </h2>
                <OrderTable orders={orders.slice(0, 5)} />
              </div>
            </section>
          </div>
        )}

        {activeTab === "Transaksi" && (
          <div className="space-y-5">
            <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      status: event.target.value,
                    })
                  }
                  className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">PENDING</option>
                  <option value="WAITING_CONFIRMATION">
                    WAITING_CONFIRMATION
                  </option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <select
                  value={filters.product}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      product: event.target.value,
                    })
                  }
                  className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
                >
                  {productOptions.map((product) => (
                    <option key={product} value={product}>
                      {product === "ALL"
                        ? "Semua Produk"
                        : product}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      dateFrom: event.target.value,
                    })
                  }
                  className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
                />

                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      dateTo: event.target.value,
                    })
                  }
                  className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
                />

                <input
                  type="search"
                  placeholder="Search invoice"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      search: event.target.value,
                    })
                  }
                  className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
                />
              </div>

              <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="rounded-lg border border-[#d5a756]/25 px-4 py-2 text-sm font-bold text-[#f0cf87] hover:bg-[#d5a756]/10"
                >
                  Unduh CSV
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  className="rounded-lg border border-[#d5a756]/25 px-4 py-2 text-sm font-bold text-[#f0cf87] hover:bg-[#d5a756]/10"
                >
                  Unduh PDF
                </button>
                <button
                  type="button"
                  onClick={exportXls}
                  className="rounded-lg border border-[#d5a756]/25 px-4 py-2 text-sm font-bold text-[#f0cf87] hover:bg-[#d5a756]/10"
                >
                  Unduh XLS
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
              {ordersLoading ? (
                <div className="py-10 text-center text-zinc-400">
                  Memuat transaksi...
                </div>
              ) : (
                <OrderTable orders={orders} />
              )}
            </div>
          </div>
        )}

        {activeTab === "Mutasi" && (
          <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#d5a756]">
                  Mutasi
                </p>
                <h2 className="text-2xl font-black">
                  Riwayat Pembayaran
                </h2>
              </div>
              <p className="text-sm text-zinc-400">
                {mutations.length} transaksi tercatat
              </p>
            </div>

            {mutations.length === 0 ? (
              <div className="py-10 text-center text-zinc-400">
                Belum ada mutasi pembayaran.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="text-zinc-400">
                    <tr className="border-b border-white/10">
                      <th className="py-3 pr-3">Tanggal</th>
                      <th className="py-3 pr-3">Invoice</th>
                      <th className="py-3 pr-3">Deskripsi</th>
                      <th className="py-3 pr-3">Metode</th>
                      <th className="py-3 pr-3">Status</th>
                      <th className="py-3 pr-3 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutations.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-white/5"
                      >
                        <td className="py-3 pr-3 text-zinc-300">
                          {formatDate(item.tanggal)}
                        </td>
                        <td className="py-3 pr-3 font-bold text-[#f0cf87]">
                          {item.invoice}
                        </td>
                        <td className="py-3 pr-3">{item.deskripsi}</td>
                        <td className="py-3 pr-3 text-zinc-300">
                          {item.metode}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-right font-bold">
                          {formatRupiah(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "Pengaturan Akun" && (
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
              <h2 className="text-xl font-black">Edit Profile</h2>
              <div className="mt-5 space-y-4">
                <input
                  value={profileForm.name}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="Nama"
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
                />
                <input
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      phone: event.target.value,
                    })
                  }
                  placeholder="Nomor HP"
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
                />
                <FilePicker file={avatarFile} onChange={setAvatarFile} />
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info
                    label="Tanggal Bergabung"
                    value={formatDate(user?.createdAt)}
                  />
                  <Info
                    label="Terakhir Login"
                    value={formatDate(user?.lastLoginAt)}
                  />
                </div>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="h-11 rounded-lg bg-[#d5a756] px-5 font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-60"
                >
                  {savingProfile ? "Menyimpan..." : "Simpan Profile"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
              <h2 className="text-xl font-black">Ganti Password</h2>
              <div className="mt-5 space-y-4">
                {[
                  ["currentPassword", "Password lama"],
                  ["newPassword", "Password baru"],
                  ["confirmPassword", "Konfirmasi password"],
                ].map(([name, placeholder]) => (
                  <input
                    key={name}
                    type="password"
                    value={passwordForm[name]}
                    onChange={(event) =>
                      setPasswordForm({
                        ...passwordForm,
                        [name]: event.target.value,
                      })
                    }
                    placeholder={placeholder}
                    className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
                  />
                ))}
                <button
                  type="button"
                  onClick={changePassword}
                  disabled={savingPassword}
                  className="h-11 rounded-lg bg-[#d5a756] px-5 font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-60"
                >
                  {savingPassword
                    ? "Menyimpan..."
                    : "Ganti Password"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
      <p className="text-sm font-semibold text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-normal text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-zinc-200">
        {value || "-"}
      </p>
    </div>
  );
}

function OrderTable({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="py-10 text-center text-zinc-400">
        Belum ada transaksi.
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 grid gap-3 md:hidden">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-black text-[#f0cf87]">
                  {order.invoice}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${statusClass(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold">
                {order.product?.name || "-"}
              </p>
              <p className="text-zinc-400">
                {order.product?.duration || "-"} /{" "}
                {order.product?.plan || "-"}
              </p>
              <p className="font-black">
                {formatRupiah(order.totalPrice)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto md:block">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="text-zinc-400">
          <tr className="border-b border-white/10">
            <th className="py-3 pr-3">Invoice</th>
            <th className="py-3 pr-3">Tanggal</th>
            <th className="py-3 pr-3">Produk</th>
            <th className="py-3 pr-3">Paket</th>
            <th className="py-3 pr-3">Status</th>
            <th className="py-3 pr-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-white/5"
            >
              <td className="py-3 pr-3 font-bold text-[#f0cf87]">
                {order.invoice}
              </td>
              <td className="py-3 pr-3 text-zinc-300">
                {formatDate(order.createdAt)}
              </td>
              <td className="py-3 pr-3">
                {order.product?.name || "-"}
              </td>
              <td className="py-3 pr-3 text-zinc-300">
                {order.product?.duration || "-"} /{" "}
                {order.product?.plan || "-"}
              </td>
              <td className="py-3 pr-3">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="py-3 pr-3 text-right font-bold">
                {formatRupiah(order.totalPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
