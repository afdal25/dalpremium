import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import FilePicker from "../components/FilePicker";
import { assetUrl as imageUrl } from "../utils/url";

export default function Settings() {
  const [form, setForm] = useState({
    appName: "",
    currency: "IDR",
    timezone: "Asia/Jakarta",
    defaultFamilySlot: 5,
    paymentGatewayVendor: "midtrans",
    paymentGatewayMerchantId: "",
    paymentGatewayApiKey: "",
    paymentGatewayPrivateKey: "",
    paymentGatewayCallbackSecret: "",
    waGatewayVendor: "fonnte",
    waGatewayApiKey: "",
    waGatewaySender: "",
    footerDescription: "",
    footerEmail: "",
    footerPhone: "",
    footerWhatsapp: "",
    footerAddress: "",
    footerPaymentImage: "",
    footerSocialInstagram: "",
    footerSocialTiktok: "",
    footerSocialYoutube: "",
    footerSocialTelegram: "",
    footerOperationalHours: "",
  });

  const [loading, setLoading] = useState(false);
  const [footerPaymentFile, setFooterPaymentFile] = useState(null);
  const [footerPaymentTitle, setFooterPaymentTitle] = useState("");
  const [footerPaymentLogos, setFooterPaymentLogos] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const [response, contentResponse] = await Promise.all([
          api.get("/settings"),
          api.get("/content/admin"),
        ]);

        if (!isMounted) {
          return;
        }

        setForm({
          appName: response.data.appName,
          currency: response.data.currency,
          timezone: response.data.timezone,
          defaultFamilySlot:
            response.data.defaultFamilySlot,
          paymentGatewayVendor:
            response.data.paymentGatewayVendor || "midtrans",
          paymentGatewayMerchantId:
            response.data.paymentGatewayMerchantId || "",
          paymentGatewayApiKey:
            response.data.paymentGatewayApiKey || "",
          paymentGatewayPrivateKey:
            response.data.paymentGatewayPrivateKey || "",
          paymentGatewayCallbackSecret:
            response.data.paymentGatewayCallbackSecret || "",
          waGatewayVendor:
            response.data.waGatewayVendor || "fonnte",
          waGatewayApiKey: response.data.waGatewayApiKey || "",
          waGatewaySender: response.data.waGatewaySender || "",
          footerDescription: response.data.footerDescription || "",
          footerEmail: response.data.footerEmail || "",
          footerPhone: response.data.footerPhone || "",
          footerWhatsapp: response.data.footerWhatsapp || "",
          footerAddress: response.data.footerAddress || "",
          footerPaymentImage: response.data.footerPaymentImage || "",
          footerSocialInstagram: response.data.footerSocialInstagram || "",
          footerSocialTiktok: response.data.footerSocialTiktok || "",
          footerSocialYoutube: response.data.footerSocialYoutube || "",
          footerSocialTelegram: response.data.footerSocialTelegram || "",
          footerOperationalHours: response.data.footerOperationalHours || "",
        });
        setFooterPaymentLogos(contentResponse.data.footerPaymentLogos || []);
      } catch {
        if (isMounted) {
          toast.error("Gagal mengambil settings");
        }
      }
    };

    loadSettings();

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

  const saveSettings = async () => {
    try {
      setLoading(true);

      await api.put("/settings", form);

      toast.success("Settings berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan settings");
    } finally {
      setLoading(false);
    }
  };

  const uploadFooterPaymentImage = async () => {
    if (!footerPaymentFile) {
      toast.error("Pilih gambar metode pembayaran dulu");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("image", footerPaymentFile);
      formData.append("title", footerPaymentTitle);

      await api.post(
        "/settings/footer-payment-logos",
        formData
      );
      const contentResponse = await api.get("/content/admin");

      setFooterPaymentLogos(contentResponse.data.footerPaymentLogos || []);
      setFooterPaymentFile(null);
      setFooterPaymentTitle("");
      toast.success("Metode pembayaran footer berhasil diupload");
    } catch {
      toast.error("Gagal upload metode pembayaran footer");
    } finally {
      setLoading(false);
    }
  };

  const deleteFooterPaymentLogo = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/settings/footer-payment-logos/${id}`);
      setFooterPaymentLogos((items) =>
        items.filter((item) => item.id !== id)
      );
      toast.success("Metode pembayaran footer dihapus");
    } catch {
      toast.error("Gagal menghapus metode pembayaran footer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-0">
      <h1 className="text-3xl font-bold mb-6">
        Settings
      </h1>

      <div className="w-full max-w-6xl rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-5">
          App Settings
        </h2>

        <div className="space-y-4">
          <input
            name="appName"
            placeholder="Nama Aplikasi"
            value={form.appName}
            onChange={handleChange}
            className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
          />

          <input
            name="currency"
            placeholder="Currency"
            value={form.currency}
            onChange={handleChange}
            className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
          />

          <input
            name="timezone"
            placeholder="Timezone"
            value={form.timezone}
            onChange={handleChange}
            className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
          />

          <input
            type="number"
            name="defaultFamilySlot"
            placeholder="Default Family Slot"
            value={form.defaultFamilySlot}
            onChange={handleChange}
            className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-400">
                Vendor Payment Gateway
              </span>
              <select
                name="paymentGatewayVendor"
                value={form.paymentGatewayVendor}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              >
                <option value="midtrans">Midtrans</option>
                <option value="tripay">Tripay</option>
                <option value="duitku">Duitku</option>
                <option value="pakasir">Pakasir</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-400">
                Vendor WA Gateway
              </span>
              <select
                name="waGatewayVendor"
                value={form.waGatewayVendor}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              >
                <option value="fonnte">Fonnte</option>
                <option value="pushwa">Pushwa</option>
                <option value="qontak">Qontak</option>
              </select>
            </label>
          </div>

          <p className="-mb-2 text-xs text-zinc-500">
            Credential gateway akan terlihat jelas saat area vendor di-hover.
          </p>

          <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-black/20 p-4 opacity-75 transition hover:opacity-100 md:grid-cols-2">
            <input
              name="paymentGatewayMerchantId"
              placeholder="Merchant ID / kode merchant"
              value={form.paymentGatewayMerchantId}
              onChange={handleChange}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
            />

            <input
              name="paymentGatewayApiKey"
              placeholder="API key payment gateway"
              value={form.paymentGatewayApiKey}
              onChange={handleChange}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
            />

            <input
              name="paymentGatewayPrivateKey"
              placeholder="Private / server key payment gateway"
              value={form.paymentGatewayPrivateKey}
              onChange={handleChange}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
            />

            <input
              name="paymentGatewayCallbackSecret"
              placeholder="Callback secret / signature key"
              value={form.paymentGatewayCallbackSecret}
              onChange={handleChange}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
            />
          </div>

          <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-black/20 p-4 opacity-75 transition hover:opacity-100 md:grid-cols-2">
            <input
              name="waGatewayApiKey"
              placeholder="API key WA gateway"
              value={form.waGatewayApiKey}
              onChange={handleChange}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
            />

            <input
              name="waGatewaySender"
              placeholder="Sender / device ID WA gateway"
              value={form.waGatewaySender}
              onChange={handleChange}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/20 p-4">
            <p className="mb-4 text-sm font-bold text-[#f0cf87]">
              Footer Website
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <textarea
                name="footerDescription"
                placeholder="Deskripsi footer"
                value={form.footerDescription}
                onChange={handleChange}
                className="min-h-24 w-full min-w-0 resize-y rounded-xl border border-zinc-700 bg-zinc-800 p-3 md:col-span-2"
              />
              <input
                name="footerEmail"
                placeholder="Email footer"
                value={form.footerEmail}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              />
              <input
                name="footerPhone"
                placeholder="Telepon footer"
                value={form.footerPhone}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              />
              <input
                name="footerWhatsapp"
                placeholder="Nomor WhatsApp bantuan"
                value={form.footerWhatsapp}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              />
              <input
                name="footerAddress"
                placeholder="Alamat footer"
                value={form.footerAddress}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              />
              <input
                name="footerSocialInstagram"
                placeholder="Instagram"
                value={form.footerSocialInstagram}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              />
              <input
                name="footerSocialTiktok"
                placeholder="TikTok"
                value={form.footerSocialTiktok}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              />
              <input
                name="footerSocialYoutube"
                placeholder="YouTube"
                value={form.footerSocialYoutube}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              />
              <input
                name="footerSocialTelegram"
                placeholder="Telegram"
                value={form.footerSocialTelegram}
                onChange={handleChange}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
              />
              <textarea
                name="footerOperationalHours"
                placeholder="Jam operasional bantuan"
                value={form.footerOperationalHours}
                onChange={handleChange}
                className="min-h-20 w-full min-w-0 resize-y rounded-xl border border-zinc-700 bg-zinc-800 p-3 md:col-span-2"
              />
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-4 md:col-span-2">
                <p className="text-sm font-bold text-zinc-300">
                  Gambar Metode Pembayaran Footer
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Bisa upload banyak logo bank, e-wallet, atau QRIS.
                </p>
                {footerPaymentLogos.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {footerPaymentLogos.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-lg border border-zinc-700 bg-black/20"
                      >
                        <div className="bg-white p-3">
                          <img
                            src={imageUrl(item.image)}
                            alt={item.title || "Metode pembayaran"}
                            className="h-12 w-full object-contain"
                          />
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-bold">
                            {item.title || "Metode pembayaran"}
                          </p>
                          <button
                            type="button"
                            onClick={() => deleteFooterPaymentLogo(item.id)}
                            disabled={loading}
                            className="mt-2 text-sm font-bold text-red-300"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input
                    value={footerPaymentTitle}
                    onChange={(event) =>
                      setFooterPaymentTitle(event.target.value)
                    }
                    placeholder="Nama, contoh BCA / QRIS"
                    className="min-w-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm"
                  />
                  <FilePicker
                    file={footerPaymentFile}
                    onChange={setFooterPaymentFile}
                  />
                  <button
                    type="button"
                    onClick={uploadFooterPaymentImage}
                    disabled={loading}
                    className="rounded-lg bg-[#d5a756] px-4 py-2 font-bold text-[#14100b] disabled:opacity-50"
                  >
                    Upload Metode
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-3 rounded-xl"
          >
            {loading ? "Saving..." : "Simpan Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

