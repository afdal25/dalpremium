import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";
import PublicFooter from "../components/PublicFooter";
import WhatsAppWidget from "../components/WhatsAppWidget";

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

export default function SearchOrder() {
  const [invoice, setInvoice] = useState("");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let isMounted = true;

    api.get("/content").then((response) => {
      if (isMounted) {
        setSettings(response.data.settings);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const searchOrder = async () => {
    if (!invoice.trim() || !phone.trim()) {
      toast.error("Invoice dan nomor HP wajib diisi");
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const response = await api.post("/orders/search", {
        invoice,
        phone,
      });

      setOrders(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal mencari order"
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
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

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar active="Cek Transaksi" logo={settings?.logo} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
        <section className="overflow-hidden rounded-2xl border border-[#d5a756]/15 bg-[#17130f]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:p-8">
            <div>
              <p className="text-sm font-bold text-[#d5a756]">
                Cek Transaksi
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Lacak pesanan dari invoice
              </h1>
              <p className="mt-3 text-zinc-400">
                Masukkan kode invoice dan nomor HP pemesan untuk melihat
                status pembayaran dan proses order.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <p className="font-black">Format Invoice</p>
              <p className="mt-2 text-3xl font-black text-[#f0cf87]">
                DP-202605001
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={invoice}
                onChange={(event) =>
                  setInvoice(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    searchOrder();
                  }
                }}
                placeholder="DP-202605001"
                className="h-12 flex-1 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
              />

              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    searchOrder();
                  }
                }}
                placeholder="Nomor HP pemesan"
                className="h-12 flex-1 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
              />

              <button
                type="button"
                onClick={searchOrder}
                disabled={loading}
                className="h-12 rounded-lg bg-[#d5a756] px-6 font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-60"
              >
                {loading ? "Mencari..." : "Cari Invoice"}
              </button>
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#d5a756]">
                    {order.invoice}
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {order.product?.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {order.product?.duration || "-"} /{" "}
                    {order.product?.plan || "-"} -{" "}
                    {formatRupiah(order.totalPrice)}
                  </p>
                  <span
                    className={`mt-3 inline-flex rounded-lg px-3 py-1 text-sm font-bold ${statusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <Link
                  to={`/order/${order.id}?token=${order.accessToken}`}
                  className="rounded-lg border border-[#d5a756]/25 px-5 py-3 text-sm font-bold text-[#f0cf87] transition hover:bg-[#d5a756]/10"
                >
                  Detail
                </Link>
              </div>
            </div>
          ))}

          {hasSearched && !loading && orders.length === 0 && (
            <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-10 text-center">
              <h3 className="text-xl font-black">
                Invoice tidak ditemukan
              </h3>
              <p className="mt-2 text-zinc-400">
                Cek lagi kode invoice dari halaman pembayaran.
              </p>
            </div>
          )}
        </div>
      </main>
      <PublicFooter logo={settings?.logo} settings={settings} />
      <WhatsAppWidget phone={settings?.footerWhatsapp || settings?.waGatewaySender} />
    </div>
  );
}
