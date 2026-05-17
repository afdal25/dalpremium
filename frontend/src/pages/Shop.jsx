import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PublicTopBar from "../components/PublicTopBar";
import PublicFooter from "../components/PublicFooter";
import WhatsAppWidget from "../components/WhatsAppWidget";
import { assetUrl as imageUrl } from "../utils/url";

const copy = {
  id: {
    products: "Produk",
    checkTransaction: "Cek Transaksi",
    howToOrder: "Cara Pesan",
    testimonials: "Testimoni",
    faq: "FAQ",
    articles: "Artikel",
    searchPlaceholder: "Cari layanan premium",
    country: "Lokasi",
    language: "Bahasa",
    indonesia: "Indonesia",
    chooseAccount: "Pilih Akun",
    choosePremium: "Pilih Aplikasi Premium",
    premiumTagline: "Pilih Aplikasi Premium",
    trustText: "Murah, Aman, dan Terpercaya",
    searchService: "Cari nama layanan",
    allServices: "Semua Layanan",
    allCategories: "Semua Kategori",
    stock: "Stok",
    outOfStock: "Stok Habis",
    variants: "varian",
    chooseAtCheckout: "Pilih durasi saat checkout.",
    startsFrom: "Mulai dari",
    choose: "Beli",
    noProductTitle: "Produk belum ketemu",
    noProductDesc: "Coba filter lain atau tambahkan produk dari halaman admin.",
    howTitle: "Cara Pesan",
    howSubtitle: "Cara praktis berlangganan layanan premium di Dalpremium",
    order: "Pesan Layanan",
    payment: "Pembayaran",
    process: "Menunggu Proses",
    received: "Pesanan Diterima",
    done: "Selesai",
    testimonialTitle: "Testimoni",
    testimonialSubtitle: "Sejak 2023, lebih dari 5000+ pengguna telah menikmati pengalaman aplikasi premium bersama kami",
    testimonialEmpty: "Foto testimoni belum ditambahkan.",
    faqTitle: "FAQ",
    faqSubtitle: "Pertanyaan yang sering ditanya",
  },
  en: {
    products: "Products",
    checkTransaction: "Check Transaction",
    howToOrder: "How To Order",
    testimonials: "Testimonials",
    faq: "FAQ",
    articles: "Articles",
    searchPlaceholder: "Search premium services",
    country: "Location",
    language: "Language",
    indonesia: "Indonesia",
    chooseAccount: "Choose Account",
    choosePremium: "Choose Premium Apps",
    premiumTagline: "Choose Premium Apps",
    trustText: "Affordable, Safe, and Trusted",
    searchService: "Search service name",
    allServices: "All Services",
    allCategories: "All Categories",
    stock: "Stock",
    outOfStock: "Out of Stock",
    variants: "variants",
    chooseAtCheckout: "Choose duration during checkout.",
    startsFrom: "Starts from",
    choose: "Buy",
    noProductTitle: "No product found",
    noProductDesc: "Try another filter or add products from admin panel.",
    howTitle: "How To Order",
    howSubtitle: "A practical way to subscribe to premium services at Dalpremium",
    order: "Order Service",
    payment: "Payment",
    process: "Processing",
    received: "Order Received",
    done: "Done",
    testimonialTitle: "Testimonials",
    testimonialSubtitle: "Since 2023, more than 5000+ users have enjoyed premium app experiences with us",
    testimonialEmpty: "No testimonial photos yet.",
    faqTitle: "FAQ",
    faqSubtitle: "Frequently Asked Questions",
  },
};

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const billingLabel = (durations) => {
  const value = Array.from(durations || [])
    .join(" ")
    .toLowerCase();

  if (value.includes("hari")) {
    return "/hari";
  }

  if (value.includes("tahun")) {
    return "/tahun";
  }

  return "/bulan";
};

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    bag: (
      <>
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    steps: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
        <path d="M7 4v4" />
        <path d="M12 10v4" />
        <path d="M17 16v4" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2l-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    faq: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.8 2.8 0 0 1 5.3 1.3c0 2.2-2.8 2.1-2.8 4.2" />
        <path d="M12 18h.01" />
      </>
    ),
    article: (
      <>
        <path d="M5 4h14v16H5V4Z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    login: (
      <>
        <path d="M14 3h5v18h-5" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </>
    ),
    userPlus: (
      <>
        <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M19 8v6" />
        <path d="M16 11h6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function StepIllustration({ type }) {
  const base = "fill-[#ff8a35] stroke-[#171026]";

  return (
    <svg viewBox="0 0 220 130" className="h-32 w-full">
      <rect x="25" y="92" width="170" height="2" className="fill-[#171026]/35" />
      {type === "order" && (
        <>
          <rect x="35" y="22" width="88" height="82" rx="8" className="fill-white stroke-[#171026]" />
          <rect x="35" y="22" width="88" height="18" rx="8" className={base} />
          <rect x="52" y="52" width="42" height="34" rx="6" className="fill-[#ff7a2f]" />
          <path d="m67 61 18 8-18 9V61Z" className="fill-white" />
          <circle cx="130" cy="52" r="18" className="fill-[#171026]" />
          <path d="M113 104c2-34 39-34 42 0" className="fill-[#ff8a35]" />
          <rect x="128" y="60" width="26" height="42" rx="4" className="fill-[#171026]" />
        </>
      )}
      {type === "pay" && (
        <>
          <circle cx="54" cy="62" r="18" className="fill-[#171026]" />
          <text x="48" y="69" className="fill-white text-[18px] font-black">$</text>
          <rect x="86" y="32" width="44" height="28" rx="5" className="fill-[#ff8a35]" />
          <path d="M94 43h28M94 50h16" className="fill-none stroke-white stroke-[3]" />
          <rect x="112" y="58" width="42" height="54" rx="7" className="fill-[#171026]" />
          <circle cx="133" cy="101" r="4" className="fill-white" />
          <path d="M142 80c24-12 38 0 42 22" className="fill-none stroke-[#171026] stroke-[3]" />
          <circle cx="178" cy="59" r="21" className="fill-[#ff8a35]" />
        </>
      )}
      {type === "process" && (
        <>
          <rect x="74" y="32" width="96" height="64" rx="8" className="fill-[#171026]" />
          <rect x="92" y="45" width="60" height="8" rx="4" className="fill-[#ff8a35]" />
          <rect x="92" y="61" width="42" height="8" rx="4" className="fill-white" />
          <circle cx="54" cy="71" r="23" className="fill-[#171026]" />
          <path d="M35 105c4-32 34-33 42 0" className="fill-[#ff8a35]" />
          <path d="M174 27h28v20h-18l-10 10V27Z" className="fill-[#ff8a35]" />
          <circle cx="190" cy="76" r="10" className="fill-[#171026]" />
          <path d="M190 61v30M175 76h30" className="stroke-[#171026] stroke-[3]" />
        </>
      )}
      {type === "receive" && (
        <>
          <rect x="116" y="35" width="72" height="58" rx="10" className="fill-white stroke-[#171026]" />
          <path d="m132 64 12 12 26-30" className="fill-none stroke-[#ff8a35] stroke-[8]" />
          <circle cx="73" cy="61" r="23" className="fill-[#ff8a35]" />
          <path d="M50 105c6-36 43-36 51 0" className="fill-[#171026]" />
          <rect x="70" y="73" width="38" height="38" rx="5" className="fill-[#171026]" />
        </>
      )}
      {type === "done" && (
        <>
          <rect x="54" y="24" width="112" height="80" rx="8" className="fill-white stroke-[#171026]" />
          <rect x="54" y="24" width="112" height="18" rx="8" className="fill-[#ff8a35]" />
          <path d="M75 63h70M75 78h50" className="stroke-[#171026] stroke-[4]" />
          <path d="m82 54 4 8 9-15 5 15 9-15 5 15 9-15 5 15 10-15" className="fill-none stroke-[#171026] stroke-[4]" />
          <circle cx="51" cy="74" r="22" className="fill-[#171026]" />
          <path d="m40 74 8 8 16-18" className="fill-none stroke-white stroke-[5]" />
        </>
      )}
    </svg>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [content, setContent] = useState({
    banners: [],
    testimonials: [],
    faqs: [],
    footerPaymentLogos: [],
  });
  const [showAllTestimonials, setShowAllTestimonials] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState("Produk");
  const [activeSlide, setActiveSlide] = useState(0);
  const [language, setLanguage] = useState(
    localStorage.getItem("shopLanguage") || "id"
  );
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    let isMounted = true;

    const fetchShopData = async () => {
      try {
        setLoading(true);
        const [productsResponse, contentResponse] =
          await Promise.all([
            api.get("/products"),
            api.get("/content"),
          ]);

        if (isMounted) {
          setProducts(
            productsResponse.data.filter((item) => item.isActive)
          );
          setContent(contentResponse.data);
        }
      } catch {
        if (isMounted) {
          setProducts([]);
          setContent({
            banners: [],
            testimonials: [],
            faqs: [],
            footerPaymentLogos: [],
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchShopData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const sections = [
      ["produk", "Produk"],
      ["cara-pesan", "Cara Pesan"],
      ["testimoni", "Testimoni"],
      ["faq", "FAQ"],
    ];

    const syncHash = () => {
      const hash = window.location.hash.replace("#", "");
      const matched = sections.find(([id]) => id === hash);

      if (matched) {
        setActiveNav(matched[1]);
        setTimeout(() => {
          document
            .getElementById(hash)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      }
    };

    syncHash();

    let scrollFrame = null;

    const syncActiveSection = () => {
      const marker =
        window.scrollY +
        Math.min(window.innerHeight * 0.35, 280);

      const current = sections.reduce(
        (activeSection, section) => {
          const [id, label] = section;
          const element = document.getElementById(id);

          if (!element) {
            return activeSection;
          }

          if (element.offsetTop <= marker) {
            return { id, label };
          }

          return activeSection;
        },
        { id: "produk", label: "Produk" }
      );

      setActiveNav(current.label);
    };

    const handleScroll = () => {
      if (scrollFrame) {
        return;
      }

      scrollFrame = requestAnimationFrame(() => {
        syncActiveSection();
        scrollFrame = null;
      });
    };

    syncActiveSection();

    window.addEventListener("hashchange", syncHash);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (scrollFrame) {
        cancelAnimationFrame(scrollFrame);
      }

      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const t = copy[language];

  const productGroups = useMemo(() => {
    const groups = new Map();

    products.forEach((product) => {
      const key = slugify(product.name);
      const existing = groups.get(key);

      if (existing) {
        existing.variants.push(product);
        existing.stock += product.stock || 0;
        existing.minPrice = Math.min(existing.minPrice, product.price);
        existing.durations.add(product.duration || "Durasi fleksibel");
        existing.plans.add(product.plan || "Standar");
      } else {
        groups.set(key, {
          key,
          name: product.name,
          description: product.description,
          image: product.image,
          category: product.category,
          variants: [product],
          stock: product.stock || 0,
          minPrice: product.price,
          durations: new Set([product.duration || "Durasi fleksibel"]),
          plans: new Set([product.plan || "Standar"]),
          categories: new Set([product.category?.name || "Tanpa Kategori"]),
        });
      }

      if (existing) {
        existing.categories.add(product.category?.name || "Tanpa Kategori");
      }
    });

    return Array.from(groups.values());
  }, [products]);

  const serviceOptions = useMemo(
    () => ["ALL", ...productGroups.map((group) => group.name)],
    [productGroups]
  );

  const categoryOptions = useMemo(() => {
    const categories = new Set();
    productGroups.forEach((group) => {
      group.categories.forEach((category) => categories.add(category));
    });

    return ["ALL", ...Array.from(categories)];
  }, [productGroups]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return productGroups.filter((group) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          group.name,
          group.description,
          ...Array.from(group.durations),
          ...Array.from(group.plans),
          ...Array.from(group.categories),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesService =
        serviceFilter === "ALL" || group.name === serviceFilter;
      const matchesCategory =
        categoryFilter === "ALL" || group.categories.has(categoryFilter);

      return matchesSearch && matchesService && matchesCategory;
    });
  }, [productGroups, query, serviceFilter, categoryFilter]);

  const carouselSlides = useMemo(() => {
    return content.banners.map((banner) => ({
      image: imageUrl(banner.image),
    }));
  }, [content.banners]);

  const activeBanner =
    carouselSlides.length > 0
      ? carouselSlides[activeSlide % carouselSlides.length]
      : null;
  const visibleTestimonials = showAllTestimonials
    ? content.testimonials
    : content.testimonials.slice(0, 6);

  const changeSlide = (direction) => {
    setActiveSlide((current) => {
      const next = current + direction;

      if (next < 0) {
        return carouselSlides.length - 1;
      }

      if (next >= carouselSlides.length) {
        return 0;
      }

      return next;
    });
  };

  useEffect(() => {
    if (activeSlide >= carouselSlides.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, carouselSlides.length]);

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar
        active={activeNav}
        logo={content.settings?.logo}
        language={language}
        onLanguageChange={setLanguage}
        onNavigate={(label) => setActiveNav(label)}
      />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {(loading || activeBanner) && (
          <section className="relative mb-7 overflow-hidden rounded-2xl border border-[#d5a756]/15 bg-[#17130f] sm:rounded-[28px]">
            <div className="relative aspect-[3/1] min-h-0 sm:aspect-auto sm:min-h-[320px] lg:min-h-[380px]">
              {loading ? (
                <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,#17130f_8%,#241b13_18%,#17130f_33%)] bg-[length:200%_100%]" />
              ) : (
                <>
                  <img
                    src={activeBanner.image}
                    alt="Banner DALPREMIUM"
                    className="absolute inset-0 h-full w-full object-contain opacity-90 sm:object-cover sm:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/10" />

                  {carouselSlides.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => changeSlide(-1)}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-[#d5a756] hover:text-[#14100b] sm:left-4 sm:h-12 sm:w-12"
                      >
                        <Icon name="chevronLeft" />
                      </button>
                      <button
                        type="button"
                        onClick={() => changeSlide(1)}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-[#d5a756] hover:text-[#14100b] sm:right-4 sm:h-12 sm:w-12"
                      >
                        <Icon name="chevronRight" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
                    {carouselSlides.map((slide, index) => (
                      <button
                        type="button"
                        key={`${slide.image}-${index}`}
                        onClick={() => setActiveSlide(index)}
                        className={`h-2.5 rounded-full transition ${
                          activeSlide === index ? "w-8 bg-[#d5a756]" : "w-2.5 bg-white/50"
                        }`}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        <section id="produk" className="scroll-mt-32">
          <div className="mb-5 text-center">
            <div>
              <h2 className="text-2xl font-black text-[#d5a756] sm:text-3xl">
                {t.premiumTagline}
              </h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-zinc-400">
              {t.trustText}
            </p>
          </div>

          <div className="mb-5 grid gap-3 rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-4 md:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchService}
                className="h-11 w-full rounded-lg border border-white/10 bg-black/30 pl-11 pr-3 outline-none focus:border-[#d5a756]"
              />
            </div>
            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
            >
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service === "ALL" ? t.allServices : service}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category === "ALL" ? t.allCategories : category}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div key={item} className="h-80 animate-pulse rounded-2xl border border-[#d5a756]/15 bg-[#17130f] sm:h-88" />
              ))}
            </div>
          ) : (
            <div className="grid auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
              {filteredGroups.map((group) => {
                const inStock = group.stock > 0;

                return (
                  <article
                    key={group.key}
                    className="group overflow-hidden rounded-xl border border-[#d5a756]/15 bg-[#17130f] shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#d5a756]/55 hover:shadow-[#d5a756]/10"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-black">
                      {group.image ? (
                        <img src={imageUrl(group.image)} alt={group.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(213,167,86,.35),transparent_34%),linear-gradient(135deg,#211915,#0d0b09)]">
                          <span className="text-7xl font-black text-[#d5a756]">{group.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#17130f] to-transparent" />
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${inStock ? "bg-[#d5a756] text-[#14100b]" : "bg-red-500 text-white"}`}>
                          {inStock
                            ? `${t.stock} ${group.stock}`
                            : t.outOfStock}
                        </span>
                        <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white backdrop-blur">
                          {group.variants.length} {t.variants}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="truncate text-xl font-black">{group.name}</h3>
                      <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-zinc-400 sm:text-sm">
                        {group.description || t.chooseAtCheckout}
                      </p>

                      <div className="mt-3 flex min-h-12 flex-wrap gap-2">
                        {Array.from(group.durations)
                          .slice(0, 3)
                          .map((duration) => (
                            <span key={duration} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-bold text-zinc-100">
                              {duration}
                            </span>
                          ))}
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-400">{t.startsFrom}</p>
                          <p className="text-xl font-black leading-tight text-white sm:text-2xl">{formatRupiah(group.minPrice)}</p>
                          <p className="mt-0.5 text-xs font-bold text-zinc-500">{billingLabel(group.durations)}</p>
                        </div>

                        <Link
                          to={`/checkout/${group.key}`}
                          aria-disabled={!inStock}
                          className={`inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-black transition ${
                            inStock ? "bg-[#d5a756] text-[#14100b] hover:bg-[#f0cf87]" : "pointer-events-none bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {t.choose}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredGroups.length === 0 && (
                <div className="col-span-full rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-10 text-center">
                  <h3 className="text-xl font-black">{t.noProductTitle}</h3>
                  <p className="mt-2 text-zinc-400">{t.noProductDesc}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section id="cara-pesan" className="mt-12 scroll-mt-32 rounded-2xl border border-[#d5a756]/15 bg-[#17130f] px-4 py-7 text-white sm:px-7">
          <div className="mb-5 text-center">
            <h2 className="text-2xl font-black text-[#d5a756] sm:text-3xl">{t.howTitle}</h2>
            <p className="mt-2 text-sm font-semibold text-zinc-400">{t.howSubtitle}</p>
          </div>
          <div className="grid auto-cols-[76%] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
            {[
              [t.order, "order"],
              [t.payment, "pay"],
              [t.process, "process"],
              [t.received, "receive"],
              [t.done, "done"],
            ].map(([title, type]) => (
              <div key={title} className="rounded-2xl border border-[#d5a756]/15 bg-black/25 p-4 text-center shadow-sm">
                <h3 className="text-base font-black">{title}</h3>
                <div className="mt-3">
                  <StepIllustration type={type} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="testimoni" className="mt-12 scroll-mt-32">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#d5a756] sm:text-3xl">{t.testimonialTitle}</h2>
            <p className="mt-2 text-sm font-semibold text-zinc-400">{t.testimonialSubtitle}</p>
          </div>
          <div className="mt-5 grid auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {visibleTestimonials.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-[#d5a756]/15 bg-[#17130f]"
              >
                <img
                  src={imageUrl(item.image)}
                  alt={t.testimonialTitle}
                  className="h-56 w-full object-cover transition duration-500 hover:scale-105"
                />
              </div>
            ))}
            {content.testimonials.length === 0 && (
              <div className="col-span-full rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-8 text-center text-zinc-400">
                {t.testimonialEmpty}
              </div>
            )}
          </div>
          {content.testimonials.length > 6 && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowAllTestimonials(!showAllTestimonials)}
                className="rounded-lg border border-[#d5a756]/25 px-5 py-3 text-sm font-black text-[#f0cf87] transition hover:bg-[#d5a756]/10"
              >
                {showAllTestimonials ? "Show Less" : "Show More"}
              </button>
            </div>
          )}
        </section>

        <section id="faq" className="mt-12 scroll-mt-32">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#d5a756] sm:text-3xl">{t.faqTitle}</h2>
            <p className="mt-2 text-sm font-semibold text-zinc-400">{t.faqSubtitle}</p>
          </div>
          <div className="mt-5 grid gap-3">
            {content.faqs.map((faq) => {
              const question =
                language === "en" && faq.questionEn
                  ? faq.questionEn
                  : faq.questionId;
              const answer =
                language === "en" && faq.answerEn
                  ? faq.answerEn
                  : faq.answerId;

              return (
              <details key={faq.id} className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
                <summary className="cursor-pointer text-base font-black">{question}</summary>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{answer}</p>
              </details>
              );
            })}
          </div>
        </section>
      </main>
      <PublicFooter
        logo={content.settings?.logo}
        settings={content.settings}
        paymentLogos={content.footerPaymentLogos}
      />
      <WhatsAppWidget
        phone={
          content.settings?.footerWhatsapp ||
          content.settings?.waGatewaySender ||
          "083897585959"
        }
      />
    </div>
  );
}
