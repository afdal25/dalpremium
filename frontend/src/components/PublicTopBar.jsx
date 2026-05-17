import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_REGISTER_PATH,
} from "../config/routes";
import { assetUrl as imageUrl } from "../utils/url";
import api from "../services/api";

const navItems = [
  { label: "Produk", key: "products", href: "/#produk", icon: "bag" },
  { label: "Cara Pesan", key: "howToOrder", href: "/#cara-pesan", icon: "steps" },
  { label: "Testimoni", key: "testimonials", href: "/#testimoni", icon: "star" },
  { label: "FAQ", key: "faq", href: "/#faq", icon: "faq" },
  { label: "Cek Transaksi", key: "checkTransaction", href: "/search-order", icon: "receipt" },
  { label: "Artikel", key: "articles", href: "/articles", icon: "article" },
];

const navCopy = {
  id: {
    products: "Produk",
    checkTransaction: "Cek Transaksi",
    howToOrder: "Cara Pesan",
    testimonials: "Testimoni",
    faq: "FAQ",
    articles: "Artikel",
    login: "Masuk",
    register: "Daftar",
    account: "Akun Saya",
    logout: "Keluar",
    location: "Lokasi",
    language: "Bahasa",
    indonesia: "Indonesia",
    indonesian: "Indonesia",
    english: "Inggris",
  },
  en: {
    products: "Products",
    checkTransaction: "Track Order",
    howToOrder: "How to Order",
    testimonials: "Testimonials",
    faq: "FAQ",
    articles: "Article",
    login: "Login",
    register: "Register",
    account: "My Account",
    logout: "Logout",
    location: "Location",
    language: "Language",
    indonesia: "Indonesia",
    indonesian: "Indonesian",
    english: "English",
  },
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
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
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

function Flag({ country = "id" }) {
  if (country === "us") {
    return (
      <span className="relative inline-block h-4 w-7 overflow-hidden rounded-sm border border-white/20 bg-[repeating-linear-gradient(to_bottom,#b91c1c_0_2px,#fff_2px_4px)] align-middle">
        <span className="absolute left-0 top-0 h-2.5 w-3 bg-blue-800" />
      </span>
    );
  }

  return (
    <span className="inline-grid h-4 w-7 overflow-hidden rounded-sm border border-white/20 align-middle">
      <span className="bg-red-600" />
      <span className="bg-white" />
    </span>
  );
}

export default function PublicTopBar({
  active = "",
  logo,
  language: controlledLanguage,
  onLanguageChange,
  onNavigate,
}) {
  const location = useLocation();
  const headerRef = useRef(null);
  const [openCustomerMenu, setOpenCustomerMenu] = useState(false);
  const [openLocaleMenu, setOpenLocaleMenu] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [localLanguage, setLocalLanguage] = useState(
    (localStorage.getItem("shopLanguage") || "id").toLowerCase()
  );
  const [remoteLogo, setRemoteLogo] = useState("");
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customerUser"));
    } catch {
      return null;
    }
  });

  const logoutCustomer = () => {
    setLoggingOut(true);

    setTimeout(() => {
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customerUser");
      setCustomerUser(null);
      setOpenCustomerMenu(false);
      setLoggingOut(false);
    }, 550);
  };

  useEffect(() => {
    if (logo) {
      setRemoteLogo("");
      return undefined;
    }

    let isMounted = true;

    api
      .get("/content")
      .then((response) => {
        if (isMounted && response.data.settings?.logo) {
          setRemoteLogo(imageUrl(response.data.settings.logo));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [logo]);

  const displayLogo = logo ? imageUrl(logo) : remoteLogo || "/favicon.png";
  const language = (controlledLanguage || localLanguage || "id").toLowerCase();
  const copy = navCopy[language] || navCopy.id;

  const closeMenus = () => {
    setOpenMobileMenu(false);
    setOpenCustomerMenu(false);
    setOpenLocaleMenu(false);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      closeMenus();
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!openCustomerMenu && !openLocaleMenu && !openMobileMenu) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        closeMenus();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openCustomerMenu, openLocaleMenu, openMobileMenu]);

  const changeLanguage = (item) => {
    localStorage.setItem("shopLanguage", item);
    setLocalLanguage(item);
    onLanguageChange?.(item);
    setOpenLocaleMenu(false);
  };

  const routeActiveKey =
    location.pathname === "/search-order"
      ? "checkTransaction"
      : location.pathname.startsWith("/articles") ||
          location.pathname.startsWith("/article/")
        ? "articles"
        : "";

  const handleSectionClick = (item) => {
    const { href, label, key } = item;

    onNavigate?.(label, key);
    closeMenus();

    if (href.startsWith("/#") && location.pathname === "/") {
      const target = document.getElementById(href.replace("/#", ""));
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderNavItem = ({ label, key, href, icon }, isMobile = false) => {
    const isActive =
      active === label ||
      active === key ||
      routeActiveKey === key ||
      (active === "Produk" && href === "/#produk");
    const className = isMobile
      ? `flex h-12 items-center gap-3 rounded-lg border px-3 text-sm font-black transition ${
          isActive
            ? "border-[#d5a756] bg-[#d5a756]/10 text-[#f0cf87]"
            : "border-white/10 bg-black/20 text-zinc-200 hover:border-white/25 hover:text-white"
        }`
      : `flex h-12 shrink-0 items-center border-b-2 px-2 text-xs font-bold transition xl:px-3 xl:text-sm ${
          isActive
            ? "border-[#d5a756] text-[#d5a756]"
            : "border-transparent text-zinc-200 hover:border-white/25 hover:text-white"
        }`;

    return (
      <Link
        key={href}
        to={href}
        onClick={() => handleSectionClick({ label, key, href })}
        className={className}
      >
        <Icon name={icon} className="mr-2 h-5 w-5" />
        {copy[key]}
      </Link>
    );
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-[#d5a756]/15 bg-[#0f0d0a]/95 shadow-2xl shadow-black/30 backdrop-blur"
    >
      {loggingOut && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-[#d5a756]/20 bg-[#17130f] px-8 py-6 text-center shadow-2xl">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d5a756]/20 border-t-[#d5a756]" />
            <p className="mt-4 font-black text-[#f0cf87]">Keluar...</p>
          </div>
        </div>
      )}
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-3 py-2 sm:min-h-20 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
        <Link
          to="/"
          aria-label="DALPREMIUM"
          onClick={closeMenus}
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d5a756]/20 bg-black sm:h-14 sm:w-14"
        >
          <img
            src={displayLogo}
            alt="DALPREMIUM"
            className="h-full w-full object-contain p-1"
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="relative z-40 hidden shrink-0 lg:block">
          <button
            type="button"
            onClick={() => {
              setOpenMobileMenu(false);
              setOpenCustomerMenu(false);
              setOpenLocaleMenu(!openLocaleMenu);
            }}
            className="flex h-11 items-center gap-2 rounded-lg border border-[#d5a756]/20 bg-black/20 px-3 text-xs font-bold text-zinc-100 transition hover:border-[#d5a756]/60 xl:h-12 xl:text-sm"
          >
            <Flag country="id" />
            {language.toUpperCase()} / IDR
          </button>
          {openLocaleMenu && (
            <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-3 shadow-2xl shadow-black/40">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                {copy.location}
              </p>
              <div className="mt-2 flex items-center gap-3 rounded-lg bg-black/20 p-3 font-bold">
                <Flag country="id" />
                {copy.indonesia}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-zinc-500">
                {copy.language}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["id", "en"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeLanguage(item)}
                    className={`rounded-lg border px-3 py-2 text-sm font-black ${
                      language === item
                        ? "border-[#d5a756] bg-[#d5a756]/10 text-[#f0cf87]"
                        : "border-white/10 bg-black/20 text-zinc-300"
                    }`}
                  >
                    <Flag country={item === "id" ? "id" : "us"} />{" "}
                    {item === "id" ? copy.indonesian : copy.english}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative z-40 ml-auto shrink-0 lg:ml-0">
          {customerUser ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setOpenMobileMenu(false);
                  setOpenLocaleMenu(false);
                  setOpenCustomerMenu(!openCustomerMenu);
                }}
                className="flex h-11 items-center gap-2 rounded-lg px-1.5 text-xs font-bold text-zinc-200 transition hover:bg-white/5 hover:text-white sm:h-12 sm:gap-3 sm:px-3 sm:text-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#d5a756]/30 bg-[#d5a756]/15 text-[#d5a756] sm:h-10 sm:w-10">
                  {customerUser.avatar ? (
                    <img
                      src={imageUrl(customerUser.avatar)}
                      alt={customerUser.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    customerUser.name?.charAt(0)
                  )}
                </span>
                <span className="max-w-[72px] truncate sm:max-w-28">
                  {customerUser.name}
                </span>
                <Icon name="chevronDown" className="h-4 w-4 text-zinc-500" />
              </button>

              {openCustomerMenu && (
                <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-lg border border-[#d5a756]/15 bg-[#17130f] shadow-2xl shadow-black/40">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="truncate font-black">{customerUser.name}</p>
                    <p className="truncate text-sm text-zinc-400">{customerUser.email}</p>
                  </div>
                  <Link
                    to={CUSTOMER_ACCOUNT_PATH}
                    onClick={closeMenus}
                    className="block px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/5"
                  >
                    {copy.account}
                  </Link>
                  <button
                    type="button"
                    onClick={logoutCustomer}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                  >
                    {copy.logout}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={CUSTOMER_LOGIN_PATH}
                onClick={closeMenus}
                className="hidden h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-black text-zinc-100 transition hover:bg-white/5 lg:flex"
              >
                <Icon name="login" className="h-5 w-5" />
                {copy.login}
              </Link>
              <Link
                to={CUSTOMER_REGISTER_PATH}
                onClick={closeMenus}
                className="hidden h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-black text-zinc-100 transition hover:bg-white/5 lg:flex"
              >
                <Icon name="userPlus" className="h-5 w-5" />
                {copy.register}
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setOpenCustomerMenu(false);
            setOpenLocaleMenu(false);
            setOpenMobileMenu(!openMobileMenu);
          }}
          className="relative z-40 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d5a756]/20 bg-black/25 text-zinc-100 transition hover:border-[#d5a756]/60 sm:h-11 sm:w-11 lg:hidden"
          aria-label="Buka navigasi"
        >
          <Icon name="menu" />
        </button>
      </div>

      {openMobileMenu && (
        <div className="absolute left-0 right-0 top-full z-50 border-t border-white/5 bg-[#0f0d0a]/98 px-3 pb-4 shadow-2xl shadow-black/50 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-h-[calc(100vh-5rem)] max-w-7xl gap-2 overflow-y-auto pt-3">
            {navItems.map((item) => renderNavItem(item, true))}

            <button
              type="button"
              onClick={() => {
                setOpenCustomerMenu(false);
                setOpenLocaleMenu(!openLocaleMenu);
              }}
              className="flex h-12 items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-black text-zinc-200"
            >
              <span className="flex items-center gap-3">
                <Flag country="id" />
                {language.toUpperCase()} / IDR
              </span>
              <Icon name="chevronDown" className="h-4 w-4" />
            </button>

            {openLocaleMenu && (
              <div className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  {copy.location}
                </p>
                <div className="mt-2 flex items-center gap-3 rounded-lg bg-black/20 p-3 font-bold">
                  <Flag country="id" />
                  {copy.indonesia}
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  {copy.language}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["id", "en"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => changeLanguage(item)}
                      className={`rounded-lg border px-3 py-2 text-sm font-black ${
                        language === item
                          ? "border-[#d5a756] bg-[#d5a756]/10 text-[#f0cf87]"
                          : "border-white/10 bg-black/20 text-zinc-300"
                      }`}
                    >
                      <Flag country={item === "id" ? "id" : "us"} />{" "}
                      {item === "id" ? copy.indonesian : copy.english}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!customerUser && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to={CUSTOMER_LOGIN_PATH}
                  onClick={closeMenus}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/20 text-sm font-black text-zinc-100"
                >
                  <Icon name="login" className="h-5 w-5" />
                  {copy.login}
                </Link>
                <Link
                  to={CUSTOMER_REGISTER_PATH}
                  onClick={closeMenus}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#d5a756] text-sm font-black text-[#14100b]"
                >
                  <Icon name="userPlus" className="h-5 w-5" />
                  {copy.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
