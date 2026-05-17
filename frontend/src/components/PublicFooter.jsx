import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import { assetUrl as imageUrl } from "../utils/url";

export default function PublicFooter({ logo, settings, paymentLogos = [] }) {
  const [loadedPaymentLogos, setLoadedPaymentLogos] = useState([]);
  const description =
    settings?.footerDescription ||
    "Langganan aplikasi premium murah, aman, cepat, dan terpercaya.";
  const displayPaymentLogos =
    paymentLogos.length > 0 ? paymentLogos : loadedPaymentLogos;

  useEffect(() => {
    if (paymentLogos.length > 0) {
      return;
    }

    let isMounted = true;

    api.get("/content")
      .then((response) => {
        if (isMounted) {
          setLoadedPaymentLogos(response.data.footerPaymentLogos || []);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [paymentLogos.length]);

  return (
    <footer className="mt-14 border-t border-[#d5a756]/15 bg-[#0b0a08] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-5 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-3 font-black text-[#d5a756]">
            <span className="flex h-14 w-14 overflow-hidden rounded-full border border-[#d5a756]/20 bg-black">
              {logo ? (
                <img
                  src={imageUrl(logo)}
                  alt="DALPREMIUM"
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <span className="text-sm font-black">D</span>
              )}
            </span>
            DALPREMIUM
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
            {description}
          </p>
          {(settings?.footerEmail || settings?.footerPhone) && (
            <div className="mt-4 grid gap-2 text-sm text-zinc-400">
              {settings.footerEmail && <span>{settings.footerEmail}</span>}
              {settings.footerPhone && <span>{settings.footerPhone}</span>}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-black text-[#d5a756]">Menu</h3>
          <div className="mt-4 grid gap-3 text-sm text-zinc-300">
            <Link className="transition hover:text-[#f0cf87]" to="/#produk">Produk</Link>
            <Link className="transition hover:text-[#f0cf87]" to="/search-order">Cek Transaksi</Link>
            <Link className="transition hover:text-[#f0cf87]" to="/#cara-pesan">Cara Pesan</Link>
            <Link className="transition hover:text-[#f0cf87]" to="/#testimoni">Testimoni</Link>
            <Link className="transition hover:text-[#f0cf87]" to="/articles">Artikel</Link>
            <Link className="transition hover:text-[#f0cf87]" to="/#faq">FAQ</Link>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-black text-[#d5a756]">Informasi</h3>
          <div className="mt-4 grid gap-3 text-sm text-zinc-300">
            <Link className="transition hover:text-[#f0cf87]" to="/syarat-ketentuan">Syarat & Ketentuan</Link>
            <Link className="transition hover:text-[#f0cf87]" to="/kebijakan-privasi">Kebijakan Privasi</Link>
            <Link className="transition hover:text-[#f0cf87]" to="/bantuan">Bantuan</Link>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-black text-[#d5a756]">Metode Pembayaran</h3>
          {displayPaymentLogos.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {displayPaymentLogos.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-white/10 bg-white p-2 transition hover:-translate-y-0.5 hover:border-[#d5a756]"
                  title={item.title || "Metode pembayaran"}
                >
                  <img
                    src={imageUrl(item.image)}
                    alt={item.title || "Metode pembayaran"}
                    className="h-10 w-full object-contain transition duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : settings?.footerPaymentImage ? (
            <img
              src={imageUrl(settings.footerPaymentImage)}
              alt="Metode pembayaran"
              className="mt-4 max-h-32 rounded-lg border border-white/10 bg-white object-contain p-3 transition hover:-translate-y-0.5 hover:border-[#d5a756]"
            />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-[#14100b]">
              {["QRIS", "BCA", "DANA", "GOPAY", "OVO", "BRIVA"].map((item) => (
                <span key={item} className="rounded-lg bg-white px-3 py-2 text-center transition hover:-translate-y-0.5">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-[#d5a756]/10 px-4 py-4 text-center text-xs font-semibold text-zinc-500 sm:text-sm">
        © 2026 DALPREMIUM - Web Beli Apk Premium Murah, Cepat,
        Terpercaya. All rights reserved.
      </div>
    </footer>
  );
}
