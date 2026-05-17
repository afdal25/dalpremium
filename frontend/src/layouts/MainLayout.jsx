import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import { ADMIN_LOGIN_PATH } from "../config/routes";
import { assetUrl as imageUrl } from "../utils/url";
import {
  clearCachedLogo,
  getCachedLogo,
  setCachedLogo,
} from "../utils/branding";

export default function MainLayout({ children }) {
  const location = useLocation();
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [appName, setAppName] = useState("DALPREMIUM");
  const [appLogo, setAppLogo] = useState(getCachedLogo);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await api.get("/settings");

        if (!isMounted) {
          return;
        }

        const nextLogo = response.data.logo
          ? imageUrl(response.data.logo)
          : "";

        setAppName(response.data.appName || "DALPREMIUM");
        setAppLogo(nextLogo ? setCachedLogo(nextLogo) : clearCachedLogo());
      } catch {
        console.log("Settings tidak ditemukan");
      }
    };

    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications");

        if (isMounted) {
          setNotifications(response.data);
        }
      } catch {
        console.log("Gagal mengambil notifikasi");
      }
    };

    loadSettings();
    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const menus = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Email Accounts",
      path: "/emails",
    },
    {
      name: "Transactions",
      path: "/transactions",
    },
  ];

  if (user?.role === "ADMIN") {
    menus.push(
      {
        name: "Products",
        path: "/products",
      },
      {
        name: "Content",
        path: "/content",
      },
      {
        name: "Orders",
        path: "/orders",
      },
      {
        name: "Users",
        path: "/users",
      },
      {
        name: "Audit Logs",
        path: "/audit-logs",
      },
      {
        name: "Settings",
        path: "/settings",
      }
    );
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = ADMIN_LOGIN_PATH;
  };

  return (
    <div className="admin-theme flex min-h-screen overflow-hidden bg-[#0f0d0a] text-white">
      {openSidebar && (
        <button
          type="button"
          aria-label="Tutup menu admin"
          onClick={() => setOpenSidebar(false)}
          className="fixed inset-0 z-[9998] bg-black/60 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[9999] flex w-72 max-w-[82vw] flex-col border-r border-[#d5a756]/15 bg-[#17130f] p-5 transition-transform duration-300 lg:static lg:w-64 lg:max-w-none lg:translate-x-0 ${
          openSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex min-h-8 items-center gap-3">
          <span className="flex h-12 w-12 overflow-hidden rounded-full border border-[#d5a756]/20 bg-black">
            {appLogo ? (
              <img
                src={appLogo}
                alt={appName}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="h-full w-full opacity-0" />
            )}
          </span>
          <h1 className="truncate text-xl font-black">
            {appName}
          </h1>
        </div>

        <nav className="space-y-2">
          {menus.map((menu) => (
            <Link
              key={menu.path}
              to={menu.path}
              onClick={() => setOpenSidebar(false)}
              className={`block rounded-lg p-3 text-sm font-bold transition ${
                location.pathname === menu.path
                  ? "bg-[#d5a756] text-[#14100b]"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {menu.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#0f0d0a]">
        {(openNotif || openProfile) && (
          <div
            onClick={() => {
              setOpenNotif(false);
              setOpenProfile(false);
            }}
            className="fixed inset-0 z-40"
          />
        )}

        <header className="sticky top-0 z-[9997] flex min-h-16 shrink-0 items-center justify-between gap-3 overflow-visible border-b border-[#d5a756]/15 bg-[#17130f] px-3 sm:min-h-20 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpenSidebar(true)}
              className="rounded-lg border border-[#d5a756]/15 bg-black/30 px-3 py-2 text-sm font-black lg:hidden"
              aria-label="Buka menu admin"
            >
              Menu
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenNotif(!openNotif);
                  setOpenProfile(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#d5a756]/15 bg-black/30 text-zinc-100 transition hover:bg-[#d5a756]/10 sm:h-12 sm:w-12"
                aria-label="Notifikasi"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {openNotif && (
                <div className="absolute right-0 top-full z-[99999] mt-3 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-lg border border-[#d5a756]/15 bg-[#17130f] shadow-2xl">
                  <div className="border-b border-white/10 p-4">
                    <h2 className="text-lg font-black">
                      Notifications
                    </h2>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className="border-b border-white/10 p-4 transition hover:bg-white/5"
                        >
                          <p className="text-sm">{item.action}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {new Date(
                              item.createdAt
                            ).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-zinc-400">
                        Tidak ada notifikasi
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenProfile(!openProfile);
                  setOpenNotif(false);
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-white/5 sm:gap-3 sm:px-3"
              >
                <div className="min-w-0 text-right">
                  <p className="hidden max-w-[120px] truncate font-bold sm:block">
                    {user?.name}
                  </p>
                  <p className="hidden text-sm text-zinc-400 sm:block">
                    {user?.role}
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d5a756]/30 bg-[#d5a756]/15 font-black text-[#d5a756] sm:h-10 sm:w-10">
                  {user?.name?.charAt(0)}
                </div>
              </button>

              {openProfile && (
                <div className="absolute right-0 top-full z-[99999] mt-3 w-56 overflow-hidden rounded-lg border border-[#d5a756]/15 bg-[#17130f] shadow-2xl">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="font-black">{user?.name}</p>
                    <p className="truncate text-sm text-zinc-400">
                      {user?.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenProfile(false);
                      window.location.href = "/my-account";
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-white/5"
                  >
                    My Account
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
