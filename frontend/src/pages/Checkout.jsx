import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";
import PublicFooter from "../components/PublicFooter";
import WhatsAppWidget from "../components/WhatsAppWidget";
import { assetUrl as imageUrl } from "../utils/url";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const optionLabel = (value, fallback) =>
  value || fallback;

export default function Checkout() {
  const { slug } = useParams();

  const [variants, setVariants] = useState([]);
  const [selectedDuration, setSelectedDuration] =
    useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  const [form, setForm] = useState(() => {
    try {
      const customerUser = JSON.parse(
        localStorage.getItem("customerUser")
      );

      return {
        customerName: customerUser?.name || "",
        customerPhone: customerUser?.phone || "",
        customerEmail: customerUser?.email || "",
        targetEmail: "",
      };
    } catch {
      return {
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        targetEmail: "",
      };
    }
  });

  useEffect(() => {
    let isMounted = true;

    const fetchVariants = async () => {
      try {
        setVariantsLoading(true);
        const [response, contentResponse] = await Promise.all([
          api.get("/products"),
          api.get("/content"),
        ]);
        const activeProducts = response.data.filter(
          (item) => item.isActive
        );

        let selectedVariants = activeProducts.filter(
          (item) => slugify(item.name) === slug
        );

        if (selectedVariants.length === 0) {
          const selectedProduct = activeProducts.find(
            (item) => item.slug === slug
          );

          if (selectedProduct) {
            selectedVariants = activeProducts.filter(
              (item) => item.name === selectedProduct.name
            );
          }
        }

        const firstAvailable =
          selectedVariants.find((item) => item.stock > 0) ||
          selectedVariants[0];

        if (isMounted) {
          setSettings(contentResponse.data.settings);
          setVariants(selectedVariants);
          setSelectedDuration(
            optionLabel(firstAvailable?.duration, "Standar")
          );
          setSelectedPlan(
            optionLabel(firstAvailable?.plan, "Standar")
          );
        }
      } catch {
        if (isMounted) {
          setVariants([]);
        }
      } finally {
        if (isMounted) {
          setVariantsLoading(false);
        }
      }
    };

    fetchVariants();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const durations = useMemo(() => {
    const values = variants.map((item) =>
      optionLabel(item.duration, "Standar")
    );

    return [...new Set(values)];
  }, [variants]);

  const plans = useMemo(() => {
    const values = variants
      .filter(
        (item) =>
          optionLabel(item.duration, "Standar") ===
          selectedDuration
      )
      .map((item) => optionLabel(item.plan, "Standar"));

    return [...new Set(values)];
  }, [selectedDuration, variants]);

  const selectedProduct = variants.find(
    (item) =>
      optionLabel(item.duration, "Standar") ===
        selectedDuration &&
      optionLabel(item.plan, "Standar") === selectedPlan
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const hasStock = (duration, plan) =>
    variants.some(
      (item) =>
        optionLabel(item.duration, "Standar") === duration &&
        optionLabel(item.plan, "Standar") === plan &&
        item.stock > 0
    );

  const durationHasStock = (duration) =>
    variants.some(
      (item) =>
        optionLabel(item.duration, "Standar") === duration &&
        item.stock > 0
    );

  const checkout = async () => {
    if (!selectedProduct) {
      toast.error("Paket belum dipilih");
      return;
    }

    if (selectedProduct.stock <= 0) {
      toast.error("Stok paket ini sedang kosong");
      return;
    }

    if (
      !form.customerName ||
      !form.customerPhone ||
      !form.customerEmail
    ) {
      toast.error("Data customer wajib diisi");
      return;
    }

    if (
      selectedProduct.deliveryType === "INVITE" &&
      !form.targetEmail
    ) {
      toast.error("Email yang mau dipremiumkan wajib diisi");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/orders", {
        ...form,
        targetEmail:
          selectedProduct.deliveryType === "INVITE"
            ? form.targetEmail
            : "",
        productId: selectedProduct.id,
      });

      toast.success("Order berhasil dibuat");

      if (response.data.paymentGateway?.redirectUrl) {
        window.location.href = response.data.paymentGateway.redirectUrl;
        return;
      }

      if (response.data.paymentGatewayError) {
        toast.error(response.data.paymentGatewayError);
      }

      window.location.href = `/payment/${response.data.order.id}?token=${response.data.order.accessToken}`;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Checkout gagal"
      );
    } finally {
      setLoading(false);
    }
  };

  if (variantsLoading) {
    return (
      <div className="min-h-screen bg-[#0f0d0a] text-white">
        <PublicTopBar logo={settings?.logo} />
        <main className="flex min-h-[60vh] items-center justify-center">
          Memuat paket...
        </main>
        <PublicFooter logo={settings?.logo} settings={settings} />
        <WhatsAppWidget
          phone={settings?.footerWhatsapp || settings?.waGatewaySender}
        />
      </div>
    );
  }

  if (!variantsLoading && variants.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0d0a] text-white">
        <PublicTopBar logo={settings?.logo} />
        <main className="flex min-h-[60vh] items-center justify-center">
          Paket tidak ditemukan
        </main>
        <PublicFooter logo={settings?.logo} settings={settings} />
        <WhatsAppWidget
          phone={settings?.footerWhatsapp || settings?.waGatewaySender}
        />
      </div>
    );
  }

  const service = variants[0];

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar logo={settings?.logo} />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <section className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6 lg:p-8">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="mb-8 text-sm font-semibold text-[#f0cf87] hover:text-white"
          >
            Kembali ke shop
          </button>

          <div className="mb-8 flex items-center gap-4">
            {service.image ? (
              <img
                src={imageUrl(service.image)}
                alt={service.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#d5a756]/15 text-3xl font-black text-[#d5a756]">
                {service.name?.charAt(0)}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-[#d5a756]">
                Pilih Langganan
              </p>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {service.name}
              </h1>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-xl font-bold">
              Pilih Durasi
            </p>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {durations.map((duration) => {
                const disabled = !durationHasStock(duration);

                return (
                  <button
                    key={duration}
                    disabled={disabled}
                    onClick={() => {
                      setSelectedDuration(duration);
                      const firstPlan = variants.find(
                        (item) =>
                          optionLabel(
                            item.duration,
                            "Standar"
                          ) === duration &&
                          item.stock > 0
                      );

                      setSelectedPlan(
                        optionLabel(firstPlan?.plan, "Standar")
                      );
                    }}
                    className={`rounded-lg border px-5 py-4 font-semibold transition ${
                      selectedDuration === duration
                        ? "border-[#d5a756] bg-[#d5a756]/10 text-white"
                        : "border-white/10 bg-black/30 text-zinc-300 hover:border-[#d5a756]/50"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {duration}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-xl font-bold">
              Pilih Jenis Paket
            </p>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => {
                const disabled = !hasStock(
                  selectedDuration,
                  plan
                );

                return (
                  <button
                    key={plan}
                    disabled={disabled}
                    onClick={() => setSelectedPlan(plan)}
                    className={`rounded-lg border px-5 py-4 font-semibold transition ${
                      selectedPlan === plan
                        ? "border-[#d5a756] bg-[#d5a756]/10 text-white"
                        : "border-white/10 bg-black/30 text-zinc-300 hover:border-[#d5a756]/50"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {plan}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <input
              name="customerName"
              placeholder="Nama customer"
              value={form.customerName}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/30 p-3 outline-none focus:border-[#d5a756]"
            />

            <input
              name="customerPhone"
              placeholder="Nomor HP / WhatsApp"
              value={form.customerPhone}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/30 p-3 outline-none focus:border-[#d5a756]"
            />

            <input
              name="customerEmail"
              placeholder="Email kontak"
              value={form.customerEmail}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/30 p-3 outline-none focus:border-[#d5a756]"
            />

            {selectedProduct?.deliveryType === "INVITE" && (
              <input
                name="targetEmail"
                placeholder="Email yang mau dipremiumkan"
                value={form.targetEmail}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/30 p-3 outline-none focus:border-[#d5a756]"
              />
            )}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6 lg:sticky lg:top-8">
          <h2 className="mb-6 text-2xl font-bold">
            Rincian
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-zinc-400">
                Layanan
              </span>
              <span className="text-right font-semibold">
                {service.name} {selectedPlan}{" "}
                {selectedDuration}
              </span>
            </div>

            <div className="flex justify-between gap-6">
              <span className="text-zinc-400">
                Harga
              </span>
              <span className="font-semibold">
                Rp{" "}
                {Number(
                  selectedProduct?.price || 0
                ).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-6">
              <span className="text-zinc-400">
                Stok
              </span>
              <span
                className={
                  selectedProduct?.stock > 0
                    ? "font-semibold text-emerald-300"
                    : "font-semibold text-red-300"
                }
              >
                {selectedProduct?.stock || 0}
              </span>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between gap-6 text-lg">
                <span>Total</span>
                <span className="font-bold">
                  Rp{" "}
                  {Number(
                    selectedProduct?.price || 0
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={checkout}
            disabled={
              loading ||
              !selectedProduct ||
              selectedProduct.stock <= 0
            }
            className="mt-8 w-full rounded-lg bg-[#d5a756] px-5 py-4 font-bold text-[#14100b] transition hover:bg-[#f0cf87] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Pesan"}
          </button>
        </aside>
      </main>
      <PublicFooter logo={settings?.logo} settings={settings} />
      <WhatsAppWidget phone={settings?.footerWhatsapp || settings?.waGatewaySender} />
    </div>
  );
}
