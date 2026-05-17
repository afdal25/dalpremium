import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";
import PublicFooter from "../components/PublicFooter";
import WhatsAppWidget from "../components/WhatsAppWidget";

const steps = [
  ["PENDING", "Menunggu Pembayaran"],
  ["WAITING_CONFIRMATION", "Verifikasi Admin"],
  ["COMPLETED", "Selesai"],
];

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

export default function OrderStatus() {
  const { id } = useParams();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      const [response, contentResponse] = await Promise.all([
        api.get(`/orders/${id}`, {
          params: { token },
        }),
        api.get("/content"),
      ]);

      if (isMounted) {
        setOrder(response.data);
        setSettings(contentResponse.data.settings);
      }
    };

    loadOrder();
    const interval = setInterval(loadOrder, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id, token]);

  useEffect(() => {
    if (!order) return;

    const interval = setInterval(() => {
      const expiredAt = new Date(
        new Date(order.createdAt).getTime() + 30 * 60 * 1000
      );
      const diff = expiredAt.getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("00:00");
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(
          seconds
        ).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0f0d0a] text-white">
        <PublicTopBar logo={settings?.logo} />
        <main className="flex min-h-[60vh] items-center justify-center">
          Loading...
        </main>
        <PublicFooter logo={settings?.logo} settings={settings} />
        <WhatsAppWidget
          phone={settings?.footerWhatsapp || settings?.waGatewaySender}
        />
      </div>
    );
  }

  const activeIndex = Math.max(
    0,
    steps.findIndex(([status]) => status === order.status)
  );

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar logo={settings?.logo} />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <section className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#d5a756]">
                Status Order
              </p>
              <h1 className="mt-1 text-3xl font-black">
                {order.invoice || `DP-${String(order.id).padStart(3, "0")}`}
              </h1>
              <p className="mt-2 text-zinc-400">
                {order.product?.name} - {formatRupiah(order.totalPrice)}
              </p>
            </div>
            <span className="rounded-full bg-[#d5a756]/15 px-4 py-2 text-sm font-black text-[#f0cf87]">
              {order.status}
            </span>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {steps.map(([status, label], index) => (
              <div
                key={status}
                className={`rounded-xl border p-5 ${
                  index <= activeIndex ||
                  order.status === "COMPLETED"
                    ? "border-[#d5a756] bg-[#d5a756]/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d5a756] font-black text-[#14100b]">
                  {index + 1}
                </div>
                <p className="mt-4 font-black">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-bold text-zinc-400">
                Detail Paket
              </p>
              <p className="mt-2 text-xl font-black">
                {order.product?.name}
              </p>
              <p className="mt-1 text-zinc-400">
                {order.product?.duration || "-"} /{" "}
                {order.product?.plan || "-"}
              </p>
              {order.targetEmail && (
                <p className="mt-3 text-sm text-zinc-300">
                  Email premium: {order.targetEmail}
                </p>
              )}
            </div>

            {order.status === "PENDING" && (
              <div className="rounded-xl border border-[#d5a756]/30 bg-[#d5a756]/10 p-5">
                <p className="font-black text-[#f0cf87]">
                  Menunggu Pembayaran
                </p>
                <p className="mt-2 text-zinc-300">
                  Sisa waktu pembayaran:
                </p>
                <p className="mt-3 text-4xl font-black">
                  {timeLeft || "--:--"}
                </p>
                <Link
                  to={`/payment/${order.id}?token=${token}`}
                  className="mt-5 inline-flex rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b]"
                >
                  Lanjut Bayar
                </Link>
              </div>
            )}

            {order.status === "COMPLETED" && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="font-black text-emerald-300">
                  Pesanan Selesai
                </p>
                {order.product?.deliveryType === "ACCOUNT" ? (
                  <div className="mt-4 space-y-2">
                    <p>Email: {order.deliveredEmail}</p>
                    <p>Password: {order.deliveredPassword}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-zinc-300">
                    Invite berhasil diproses. Silakan cek email.
                  </p>
                )}
              </div>
            )}

            {["CANCELLED", "REJECTED"].includes(order.status) && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="font-black text-red-300">
                  Pesanan Tidak Berhasil
                </p>
                <p className="mt-2 text-zinc-300">
                  Status pesanan: {order.status}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter logo={settings?.logo} settings={settings} />
      <WhatsAppWidget phone={settings?.footerWhatsapp || settings?.waGatewaySender} />
    </div>
  );
}
