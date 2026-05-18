import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";
import { optimizedImageUrl } from "../utils/url";

const PublicFooter = lazy(() => import("../components/PublicFooter"));
const WhatsAppWidget = lazy(() =>
  import("../components/WhatsAppWidget")
);

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const titleFromSlug = (value = "") =>
  value
    .split("-")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");

const optionLabel = (value, fallback) =>
  value || fallback;

const SHOP_CACHE_KEY = "dalpremiumShopPayload";
const SHOP_CACHE_TTL = 1000 * 60 * 10;

const getCachedCheckoutData = (slug) => {
  try {
    const cached = JSON.parse(localStorage.getItem(SHOP_CACHE_KEY));

    if (!cached || Date.now() - cached.savedAt > SHOP_CACHE_TTL) {
      return null;
    }

    const products = cached.payload?.products || [];
    let selectedVariants = products.filter(
      (item) => slugify(item.name) === slug
    );

    if (selectedVariants.length === 0) {
      const selectedProduct = products.find((item) => item.slug === slug);

      if (selectedProduct) {
        selectedVariants = products.filter(
          (item) => item.name === selectedProduct.name
        );
      }
    }

    return {
      variants: selectedVariants,
      settings: cached.payload?.content?.settings || null,
    };
  } catch {
    return null;
  }
};

const getFirstAvailable = (items) =>
  items.find((item) => item.stock > 0) || items[0];

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const variantTitle = (product) =>
  [product?.plan, product?.duration]
    .filter(Boolean)
    .join(" ") || product?.name || "Paket Premium";

const getMethodImage = (method) =>
  method?.logo || method?.qrisImage || "";

export default function Checkout() {
  const { slug } = useParams();
  const fallbackTitle = titleFromSlug(slug);
  const cachedCheckout = useMemo(
    () => getCachedCheckoutData(slug),
    [slug]
  );
  const cachedFirstAvailable = getFirstAvailable(
    cachedCheckout?.variants || []
  );

  const [variants, setVariants] = useState(
    cachedCheckout?.variants || []
  );
  const [selectedDuration, setSelectedDuration] =
    useState(
      optionLabel(cachedFirstAvailable?.duration, "Standar")
    );
  const [selectedPlan, setSelectedPlan] = useState(
    optionLabel(cachedFirstAvailable?.plan, "Standar")
  );
  const [loading, setLoading] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(
    !cachedCheckout?.variants?.length
  );
  const [settings, setSettings] = useState(
    cachedCheckout?.settings || null
  );
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    useState("");
  const [previewQrisImage, setPreviewQrisImage] = useState("");

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
        if (!cachedCheckout?.variants?.length) {
          setVariantsLoading(true);
        }

        let activeProducts = [];
        let nextSettings = null;

        try {
          const response = await api.get("/shop");
          activeProducts = response.data.products || [];
          nextSettings = response.data.content?.settings || null;
        } catch {
          const [response, contentResponse] = await Promise.all([
            api.get("/products"),
            api.get("/content"),
          ]);

          activeProducts = response.data.filter(
            (item) => item.isActive
          );
          nextSettings = contentResponse.data.settings;
        }

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
          setSettings(nextSettings);
          setVariants(selectedVariants);
          setSelectedDuration(
            optionLabel(firstAvailable?.duration, "Standar")
          );
          setSelectedPlan(
            optionLabel(firstAvailable?.plan, "Standar")
          );
        }
      } catch {
        if (isMounted && !cachedCheckout?.variants?.length) {
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
  }, [cachedCheckout, slug]);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/payment-methods")
      .then((response) => {
        if (isMounted) {
          const methods = response.data || [];
          setPaymentMethods(methods);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPaymentMethods([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProduct = variants.find(
    (item) =>
      optionLabel(item.duration, "Standar") ===
        selectedDuration &&
      optionLabel(item.plan, "Standar") === selectedPlan
  );

  const orderedVariants = useMemo(() => {
    const selectedId = selectedProduct?.id;

    return [...variants].sort((a, b) => {
      if (a.id === selectedId) return -1;
      if (b.id === selectedId) return 1;
      return Number(a.price || 0) - Number(b.price || 0);
    });
  }, [selectedProduct?.id, variants]);

  const primaryVariants = orderedVariants.slice(0, 3);
  const otherVariants = orderedVariants.slice(3);
  const selectedPaymentMethod = paymentMethods.find(
    (method) => String(method.id) === selectedPaymentMethodId
  );

  const selectVariant = (product) => {
    setSelectedDuration(optionLabel(product.duration, "Standar"));
    setSelectedPlan(optionLabel(product.plan, "Standar"));
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

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

    if (paymentMethods.length > 0 && !selectedPaymentMethodId) {
      toast.error("Pilih metode pembayaran dulu");
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

      const methodQuery = selectedPaymentMethodId
        ? `&method=${encodeURIComponent(selectedPaymentMethodId)}`
        : "";

      window.location.href = `/payment/${response.data.order.id}?token=${response.data.order.accessToken}${methodQuery}`;
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
        <main className="mx-auto grid min-h-[760px] max-w-6xl gap-6 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <section className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6 lg:p-8">
            <div className="mb-8 h-5 w-28 animate-pulse rounded bg-[#d5a756]/15" />
            <div className="mb-8 flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-lg bg-black/40" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#d5a756]">
                  Pilih Langganan
                </p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                  {fallbackTitle || "Paket Premium"}
                </h1>
              </div>
            </div>
            <div className="space-y-8">
              {[1, 2, 3].map((item) => (
                <div key={item}>
                  <div className="mb-3 h-6 w-40 animate-pulse rounded bg-white/10" />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((box) => (
                      <div key={box} className="h-14 animate-pulse rounded-lg bg-black/30" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <aside className="h-fit min-h-80 rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
            <div className="mb-6 h-8 w-28 animate-pulse rounded bg-white/10" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-5 animate-pulse rounded bg-white/10" />
              ))}
            </div>
            <div className="mt-8 h-14 animate-pulse rounded-lg bg-[#d5a756]/30" />
          </aside>
        </main>
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
        <div className="min-h-72">
          <Suspense fallback={null}>
            <PublicFooter logo={settings?.logo} settings={settings} />
            <WhatsAppWidget
              phone={settings?.footerWhatsapp || settings?.waGatewaySender}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  const service = variants[0];

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar logo={settings?.logo} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="mb-6 text-sm font-semibold text-[#f0cf87] hover:text-white"
        >
          Kembali ke shop
        </button>

        <div className="mb-6 flex items-center gap-4">
          {service.image ? (
            <img
              src={optimizedImageUrl(service.image, {
                width: 96,
                height: 96,
                crop: "fill",
                quality: "auto:low",
              })}
              alt={service.name}
              loading="eager"
              decoding="async"
              width="64"
              height="64"
              className="h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#d5a756]/15 text-3xl font-black text-[#d5a756]">
              {service.name?.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#d5a756]">
              Pilih Paket
            </p>
            <h1 className="truncate text-3xl font-black sm:text-4xl">
              {service.name}
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
              <h2 className="text-xl font-black text-[#d5a756]">
                Keterangan
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
                {selectedProduct?.description ||
                  "Pilih paket sesuai kebutuhan. Pesanan diproses setelah pembayaran berhasil dikonfirmasi admin."}
              </p>
            </div>

            <div className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
              <h2 className="text-xl font-black text-[#d5a756]">
                Pilih Paket
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {primaryVariants.map((product) => {
                  const active = product.id === selectedProduct?.id;
                  const inStock = product.stock > 0;

                  return (
                    <button
                      type="button"
                      key={product.id}
                      disabled={!inStock}
                      onClick={() => selectVariant(product)}
                      className={`min-h-36 rounded-2xl border p-5 text-left transition ${
                        active
                          ? "border-[#d5a756] bg-[#2a2114] shadow-lg shadow-[#d5a756]/10"
                          : "border-[#d5a756]/15 bg-[#100d09] hover:border-[#d5a756]/60 hover:bg-[#1a140e]"
                      } ${!inStock ? "opacity-65 saturate-75" : ""}`}
                    >
                      <div className="flex h-full flex-col justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black text-zinc-100">
                            {variantTitle(product)}
                          </h3>
                          <p className="mt-2 text-2xl font-black text-[#f0cf87]">
                            {formatRupiah(product.price)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className={inStock ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-red-300"}>
                            {inStock ? "Tersedia" : "Stok habis"}
                          </span>
                          <span className="rounded-full bg-[#d5a756]/10 px-3 py-1 text-xs font-bold text-[#f0cf87]">
                            {product.deliveryType === "INVITE" ? "Invite" : "Akun"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {otherVariants.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-4 text-2xl font-black text-[#d5a756]">
                    Lainnya
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {otherVariants.map((product) => {
                      const active = product.id === selectedProduct?.id;
                      const inStock = product.stock > 0;

                      return (
                        <button
                          type="button"
                          key={product.id}
                          disabled={!inStock}
                          onClick={() => selectVariant(product)}
                          className={`min-h-32 rounded-2xl border p-5 text-left transition ${
                            active
                              ? "border-[#d5a756] bg-[#2a2114]"
                              : "border-[#d5a756]/15 bg-[#100d09] hover:border-[#d5a756]/60 hover:bg-[#1a140e]"
                          } ${!inStock ? "opacity-65 saturate-75" : ""}`}
                        >
                          <h4 className="font-black text-zinc-100">
                            {variantTitle(product)}
                          </h4>
                          <p className="mt-2 text-2xl font-black text-[#f0cf87]">
                            {formatRupiah(product.price)}
                          </p>
                          <p className={inStock ? "mt-3 text-sm font-semibold text-emerald-300" : "mt-3 text-sm font-semibold text-red-300"}>
                            {inStock ? "Tersedia" : "Stok habis"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
              <h2 className="text-xl font-black text-[#d5a756]">
                Metode Pembayaran
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => setSelectedPaymentMethodId(String(method.id))}
                      className={`rounded-xl border p-4 text-left transition ${
                        String(method.id) === selectedPaymentMethodId
                          ? "border-[#d5a756] bg-[#d5a756]/10 shadow-lg shadow-[#d5a756]/10"
                          : "border-white/10 bg-black/25 hover:border-[#d5a756]/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getMethodImage(method) ? (
                          <img
                            src={optimizedImageUrl(getMethodImage(method), {
                              width: 96,
                              height: 48,
                              crop: "fit",
                              quality: "auto:low",
                            })}
                            alt={method.name}
                            loading="lazy"
                            decoding="async"
                            className="h-10 w-16 rounded bg-white object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-10 w-16 items-center justify-center rounded bg-[#d5a756]/15 text-xs font-black text-[#d5a756]">
                            PAY
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-black">{method.name}</p>
                          <p className="truncate text-xs text-zinc-400">
                            {method.accountName || "DALPREMIUM"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-sm text-zinc-400">
                    Metode pembayaran akan muncul setelah admin mengaktifkannya.
                  </p>
                )}
              </div>

              {selectedPaymentMethod && (
                <div className="mt-5 rounded-xl border border-[#d5a756]/15 bg-black/25 p-5">
                  {selectedPaymentMethod.qrisImage ? (
                    <div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#d5a756]">
                            QRIS
                          </p>
                          <h3 className="mt-1 text-xl font-black">
                            Scan QRIS untuk pembayaran
                          </h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            Pastikan nominal transfer sesuai total pesanan.
                          </p>
                        </div>
                        <div className="rounded-lg bg-[#d5a756]/10 px-3 py-2 text-sm font-bold text-[#f0cf87]">
                          {selectedPaymentMethod.accountName || selectedPaymentMethod.name}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewQrisImage(
                            selectedPaymentMethod.qrisImage
                          )
                        }
                        className="mt-4 block w-full overflow-hidden rounded-xl border border-white/10 bg-white p-3 transition hover:scale-[1.01] hover:border-[#d5a756]"
                      >
                        <img
                          src={optimizedImageUrl(selectedPaymentMethod.qrisImage, {
                            width: 640,
                            crop: "limit",
                            quality: "auto:eco",
                          })}
                          alt={`${selectedPaymentMethod.name} QRIS`}
                          loading="lazy"
                          decoding="async"
                          className="max-h-[420px] w-full object-contain"
                        />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-[#d5a756]">
                        Rekening / E-Wallet
                      </p>
                      <h3 className="mt-1 text-xl font-black">
                        {selectedPaymentMethod.name}
                      </h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                          <p className="text-xs font-semibold text-zinc-400">
                            Nomor tujuan
                          </p>
                          <p className="mt-1 break-all text-2xl font-black text-[#f0cf87]">
                            {selectedPaymentMethod.accountNumber || "-"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                          <p className="text-xs font-semibold text-zinc-400">
                            Atas nama
                          </p>
                          <p className="mt-1 break-words text-lg font-black">
                            {selectedPaymentMethod.accountName || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod.instructions && (
                    <p className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4 text-sm leading-6 text-zinc-300">
                      {selectedPaymentMethod.instructions}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
              <h2 className="text-xl font-black text-[#d5a756]">
                Detail Kontak
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    placeholder="Email yang ingin dipremiumkan"
                    value={form.targetEmail}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 p-3 outline-none focus:border-[#d5a756]"
                  />
                )}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6 lg:sticky lg:top-24">
            <h2 className="mb-6 text-2xl font-bold">
              Rincian
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between gap-6">
                <span className="text-zinc-400">
                  Layanan
                </span>
                <span className="text-right font-semibold">
                  {service.name}
                </span>
              </div>

              <div className="flex justify-between gap-6">
                <span className="text-zinc-400">
                  Paket
                </span>
                <span className="text-right font-semibold">
                  {variantTitle(selectedProduct)}
                </span>
              </div>

              <div className="flex justify-between gap-6">
                <span className="text-zinc-400">
                  Harga
                </span>
                <span className="font-semibold">
                  {formatRupiah(selectedProduct?.price)}
                </span>
              </div>

              <div className="flex justify-between gap-6">
                <span className="text-zinc-400">
                  Tipe
                </span>
                <span className="font-semibold">
                  {selectedProduct?.deliveryType === "INVITE"
                    ? "Via Invite"
                    : "Kirim Akun"}
                </span>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between gap-6 text-lg">
                  <span>Total</span>
                  <span className="font-bold">
                    {formatRupiah(selectedProduct?.price)}
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
              {loading ? "Loading..." : "Pesan Sekarang"}
            </button>
          </aside>
        </div>
      </main>
      <div className="min-h-72">
        <Suspense fallback={null}>
          <PublicFooter logo={settings?.logo} settings={settings} />
          <WhatsAppWidget phone={settings?.footerWhatsapp || settings?.waGatewaySender} />
        </Suspense>
      </div>

      {previewQrisImage && (
        <button
          type="button"
          onClick={() => setPreviewQrisImage("")}
          className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          aria-label="Tutup preview QRIS"
        >
          <img
            src={optimizedImageUrl(previewQrisImage, {
              width: 1200,
              crop: "limit",
              quality: "auto:good",
            })}
            alt="Preview QRIS"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl bg-white object-contain p-3 shadow-2xl"
          />
        </button>
      )}
    </div>
  );
}
