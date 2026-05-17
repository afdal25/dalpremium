import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";
import PublicFooter from "../components/PublicFooter";
import WhatsAppWidget from "../components/WhatsAppWidget";
import FilePicker from "../components/FilePicker";
import { assetUrl as imageUrl } from "../utils/url";

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const fallbackMethods = [
  {
    id: "bca",
    name: "BCA",
    accountNumber: "1234567890",
    accountName: "DALPREM",
    instructions: "Transfer sesuai nominal total pembayaran.",
  },
  {
    id: "dana",
    name: "DANA",
    accountNumber: "081234567890",
    accountName: "DALPREM",
    instructions: "Kirim ke nomor DANA lalu upload bukti bayar.",
  },
  {
    id: "qris",
    name: "QRIS",
    accountNumber: "Hubungi Admin",
    accountName: "DALPREM",
    instructions: "Minta QRIS aktif ke admin jika belum tampil.",
  },
];

export default function Payment() {
  const { id } = useParams();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const [paymentProof, setPaymentProof] = useState(null);
  const [order, setOrder] = useState(null);
  const [methods, setMethods] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedMethodId, setSelectedMethodId] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [gatewayPayment, setGatewayPayment] = useState(null);
  const [gatewayError, setGatewayError] = useState("");
  const [gatewayLoading, setGatewayLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [orderResponse, methodsResponse, contentResponse] =
          await Promise.all([
            api.get(`/orders/${id}`, {
              params: { token },
            }),
            api.get("/payment-methods"),
            api.get("/content"),
          ]);

        if (isMounted) {
          setOrder(orderResponse.data);
          setMethods(methodsResponse.data);
          setSettings(contentResponse.data.settings);
          setSelectedMethodId(methodsResponse.data[0]?.id || null);
          if (orderResponse.data.paymentGatewayUrl) {
            setGatewayPayment({
              vendor: orderResponse.data.paymentGatewayVendor,
              reference: orderResponse.data.paymentGatewayReference,
              redirectUrl: orderResponse.data.paymentGatewayUrl,
              status: orderResponse.data.paymentGatewayStatus,
            });
          }
        }
      } catch {
        if (isMounted) {
          setOrder(null);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  const selectedMethod = methods.find(
    (method) => method.id === selectedMethodId
  );
  const paymentMethods =
    methods.length > 0 ? methods : fallbackMethods;
  const activeMethod =
    selectedMethod ||
    paymentMethods.find(
      (method) => method.id === selectedMethodId
    ) ||
    paymentMethods[0];
  const showGatewayPayment =
    Boolean(settings?.paymentGatewayEnabled) ||
    Boolean(gatewayPayment?.redirectUrl);

  const createGatewayPayment = async () => {
    try {
      setGatewayLoading(true);
      setGatewayError("");
      const response = await api.post(
        `/orders/${id}/gateway-payment`,
        {},
        {
          params: { token },
        }
      );

      setGatewayPayment(response.data.paymentGateway);
      window.location.href =
        response.data.paymentGateway.redirectUrl;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Payment gateway belum bisa digunakan";
      setGatewayError(message);
      toast.error(message);
    } finally {
      setGatewayLoading(false);
    }
  };

  const submitProof = async () => {
    if (!paymentProof) {
      toast.error("Bukti bayar wajib diupload");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("paymentProof", paymentProof);

      await api.put(`/orders/${id}/payment-proof`, formData, {
        params: { token },
      });

      toast.success("Bukti bayar berhasil dikirim");
      window.location.href = `/order/${id}?token=${token}`;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal kirim bukti bayar"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar logo={settings?.logo} />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <section className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
          <p className="text-sm font-bold text-[#d5a756]">
            Pembayaran
          </p>
          <h1 className="mt-1 text-3xl font-black">
            Pilih Metode Pembayaran
          </h1>
          <p className="mt-2 text-zinc-400">
            Transfer sesuai total, lalu upload bukti pembayaran.
          </p>

          {showGatewayPayment && (
            <div className="mt-6 rounded-xl border border-[#d5a756]/25 bg-[#d5a756]/10 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#f0cf87]">
                    Payment Gateway
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Bayar otomatis via Midtrans
                  </h2>
                  <p className="mt-1 text-sm text-zinc-300">
                    Setelah pembayaran sukses, status order akan masuk ke
                    menunggu konfirmasi admin.
                  </p>
                  {gatewayError && (
                    <p className="mt-2 text-sm font-bold text-red-300">
                      {gatewayError}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (gatewayPayment?.redirectUrl) {
                      window.location.href = gatewayPayment.redirectUrl;
                      return;
                    }

                    createGatewayPayment();
                  }}
                  disabled={gatewayLoading || order?.status !== "PENDING"}
                  className="rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-50"
                >
                  {gatewayLoading
                    ? "Membuat link..."
                    : gatewayPayment?.redirectUrl
                      ? "Lanjut Bayar"
                      : "Bayar Otomatis"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {paymentMethods.map((method) => (
              <button
                type="button"
                key={method.id}
                onClick={() => setSelectedMethodId(method.id)}
                className={`rounded-xl border p-5 text-left transition ${
                  selectedMethodId === method.id ||
                  (!selectedMethodId &&
                    method.id === paymentMethods[0]?.id)
                    ? "border-[#d5a756] bg-[#d5a756]/10"
                    : "border-white/10 bg-black/20 hover:border-[#d5a756]/50"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white text-lg font-black text-[#14100b]">
                    {method.logo ? (
                      <img
                        src={imageUrl(method.logo)}
                        alt={method.name}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      method.name?.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xl font-black">{method.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      a/n {method.accountName}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-2xl font-black text-[#f0cf87]">
                  {method.accountNumber}
                </p>
                {method.instructions && (
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {method.instructions}
                  </p>
                )}
              </button>
            ))}
          </div>

          {activeMethod?.qrisImage && (
            <div className="mt-6 rounded-xl border border-[#d5a756]/15 bg-black/20 p-5">
              <p className="font-black">QRIS</p>
              <p className="mt-1 text-sm text-zinc-400">
                Scan kode ini lalu upload bukti pembayaran.
              </p>
              <img
                src={imageUrl(activeMethod.qrisImage)}
                alt={`${activeMethod.name} QRIS`}
                className="mt-4 max-h-80 w-full rounded-xl border border-white/10 bg-white object-contain p-4"
              />
            </div>
          )}

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5">
            <p className="font-black">Upload Bukti Bayar</p>
            <FilePicker
              file={paymentProof}
              onChange={setPaymentProof}
              className="mt-4"
            />
            <button
              type="button"
              onClick={submitProof}
              disabled={loading || !activeMethod}
              className="mt-4 w-full rounded-lg bg-[#d5a756] py-3 font-black text-[#14100b] transition hover:bg-[#f0cf87] disabled:opacity-60"
            >
              {loading ? "Mengirim..." : "Kirim Bukti Bayar"}
            </button>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6 lg:sticky lg:top-8">
          <h2 className="text-xl font-black">Ringkasan Order</h2>
          <div className="mt-5 space-y-4 text-sm">
            <Info label="Invoice" value={order?.invoice || "-"} />
            <Info label="Produk" value={order?.product?.name || "-"} />
            <Info
              label="Paket"
              value={`${order?.product?.duration || "-"} / ${
                order?.product?.plan || "-"
              }`}
            />
            <div className="border-t border-white/10 pt-4">
              <p className="text-zinc-400">Total Pembayaran</p>
              <p className="mt-1 text-3xl font-black text-[#f0cf87]">
                {formatRupiah(order?.totalPrice || 0)}
              </p>
            </div>
          </div>
        </aside>
      </main>
      <PublicFooter logo={settings?.logo} settings={settings} />
      <WhatsAppWidget phone={settings?.footerWhatsapp || settings?.waGatewaySender} />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
