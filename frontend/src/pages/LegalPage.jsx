import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PublicTopBar from "../components/PublicTopBar";
import PublicFooter from "../components/PublicFooter";
import WhatsAppWidget from "../components/WhatsAppWidget";
import api from "../services/api";

const fallbackPages = {
  "/syarat-ketentuan": {
    type: "TERMS",
    label: "Syarat dan Ketentuan",
    intro:
      "Dengan mengakses dan menggunakan layanan kami, Anda menyetujui syarat dan ketentuan berikut. Harap baca dengan saksama sebelum melakukan transaksi.",
    content:
      "Definisi\nPlatform mengacu pada website DALPREMIUM. Pengguna adalah setiap individu yang mengakses atau menggunakan layanan.\n\nTransaksi\nSetiap pembelian wajib mengikuti alur pemesanan, pembayaran, dan konfirmasi yang tersedia di platform.\n\nProduk Digital\nProduk berupa akses akun, invite, atau instruksi aktivasi layanan premium sesuai paket yang dipilih.\n\nPembayaran\nPembayaran dianggap sah setelah bukti bayar diverifikasi oleh admin.\n\nPenyelesaian Sengketa\nSetiap perselisihan akan diselesaikan secara musyawarah terlebih dahulu dan tunduk pada hukum Republik Indonesia.",
    note: "Dengan menggunakan layanan DALPREMIUM, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat yang berlaku.",
  },
  "/kebijakan-privasi": {
    type: "PRIVACY",
    label: "Kebijakan Privasi",
    intro:
      "DALPREMIUM berkomitmen untuk melindungi privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi.",
    content:
      "Data yang Kami Kumpulkan\nNama, email, nomor WhatsApp, invoice, detail pesanan, dan bukti pembayaran yang diperlukan untuk memproses transaksi.\n\nPenggunaan Data\nData digunakan untuk memproses pesanan, mengirim notifikasi, memberikan bantuan, dan meningkatkan kualitas layanan.\n\nKeamanan\nKami menjaga data pelanggan secara bertanggung jawab dan tidak menjual data kepada pihak ketiga.\n\nHak Pengguna\nAnda dapat meminta koreksi atau penghapusan data sesuai ketentuan yang berlaku.",
    note: "Kami hanya mengumpulkan data yang diperlukan untuk memproses transaksi dan memberikan layanan.",
  },
  "/bantuan": {
    type: "HELP",
    label: "Hubungi Kami",
    intro:
      "Ada pertanyaan atau butuh bantuan? Kami siap membantu Anda. Pilih cara yang paling nyaman untuk menghubungi kami.",
    content:
      "Tim support DALPREMIUM siap membantu pengecekan invoice, pembayaran, dan kendala akses akun premium.",
    note: "Cantumkan invoice saat menghubungi admin agar pengecekan lebih cepat.",
  },
};

const contactItems = (settings) => [
  ["Email", settings?.footerEmail || "admin@dalpremium.com", "mailto"],
  ["Telepon", settings?.footerPhone || "085171236050", "phone"],
  ["WhatsApp", settings?.footerWhatsapp || settings?.waGatewaySender || "085171236050", "wa"],
  ["Alamat", settings?.footerAddress || "Indonesia", "map"],
];

const legalPoints = (text = "") =>
  text
    .split(/\n{2,}|\n/)
    .map((item) =>
      item
        .trim()
        .replace(/^\d+[).]\s*/, "")
        .replace(/^[-•]\s*/, "")
    )
    .filter(Boolean);

export default function LegalPage() {
  const location = useLocation();
  const pagePath = location.pathname;
  const fallback =
    fallbackPages[pagePath] || fallbackPages["/syarat-ketentuan"];
  const [settings, setSettings] = useState(null);
  const [legalDocuments, setLegalDocuments] = useState([]);
  const [paymentLogos, setPaymentLogos] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentFailed, setContentFailed] = useState(false);
  const [messageForm, setMessageForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    let isMounted = true;

    setContentLoading(true);
    setContentFailed(false);
    setLegalDocuments([]);

    api
      .get("/content", {
        params: {
          page: fallback.type,
          t: Date.now(),
        },
      })
      .then((response) => {
        if (isMounted) {
          setSettings(response.data.settings);
          setLegalDocuments(response.data.legalDocuments || []);
          setPaymentLogos(response.data.footerPaymentLogos || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setContentFailed(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setContentLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fallback.type]);

  const page = useMemo(() => {
    const document = legalDocuments.find(
      (item) => item.type === fallback.type
    );

    if (!document) {
      return fallback;
    }

    return {
      type: document.type,
      label: document.title,
      intro: document.intro,
      content: document.content,
      note: document.note,
    };
  }, [fallback.type, fallback.label, fallback.intro, fallback.content, fallback.note, legalDocuments]);

  const showLoadingState = contentLoading && !contentFailed;

  const submitMessage = (event) => {
    event.preventDefault();

    const email = settings?.footerEmail || "admin@dalpremium.com";
    const subject = encodeURIComponent(
      messageForm.subject || "Bantuan DALPREMIUM"
    );
    const body = encodeURIComponent(
      `Nama: ${messageForm.name}\nEmail: ${messageForm.email}\n\n${messageForm.message}`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  if (fallback.type === "HELP") {
    return (
      <div key={pagePath} className="min-h-screen bg-[#0f0d0a] text-white">
        <PublicTopBar active="Bantuan" logo={settings?.logo} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
          <section className="text-center">
            <h1 className="text-3xl font-black text-[#d5a756] md:text-5xl">
              {page.label}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-zinc-100">
              {page.intro}
            </p>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6 lg:p-8">
              <h2 className="text-3xl font-black text-[#d5a756]">
                Informasi Kontak
              </h2>
              <div className="mt-6 space-y-4">
                {contactItems(settings).map(([label, value, type]) => (
                  <ContactCard
                    key={label}
                    label={label}
                    value={value}
                    type={type}
                  />
                ))}
              </div>
            </div>

            <form
              onSubmit={submitMessage}
              className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6 lg:p-8"
            >
              <h2 className="text-3xl font-black text-[#d5a756]">Kirim Pesan</h2>
              <div className="mt-6 space-y-4">
                <Input
                  label="Nama Lengkap"
                  value={messageForm.name}
                  onChange={(value) =>
                    setMessageForm({ ...messageForm, name: value })
                  }
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={messageForm.email}
                  onChange={(value) =>
                    setMessageForm({ ...messageForm, email: value })
                  }
                  required
                />
                <Input
                  label="Subjek"
                  value={messageForm.subject}
                  onChange={(value) =>
                    setMessageForm({ ...messageForm, subject: value })
                  }
                  required
                />
                <label className="block text-sm font-bold">
                  Pesan
                  <textarea
                    value={messageForm.message}
                    onChange={(event) =>
                      setMessageForm({
                        ...messageForm,
                        message: event.target.value,
                      })
                    }
                    required
                    placeholder="Tulis pesan Anda di sini..."
                    className="mt-2 min-h-36 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] transition hover:bg-[#f0cf87]"
                >
                  Kirim ke Email
                </button>
              </div>
            </form>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
              <h2 className="text-2xl font-black text-[#d5a756]">Media Sosial</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Instagram", settings?.footerSocialInstagram],
                  ["TikTok", settings?.footerSocialTiktok],
                  ["YouTube", settings?.footerSocialYoutube],
                  ["Telegram", settings?.footerSocialTelegram],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/10 bg-black/20 p-4 font-bold text-zinc-300"
                  >
                    <p>{label}</p>
                    <p className="mt-1 break-words text-sm text-zinc-500">
                      {value || "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6">
              <h2 className="text-2xl font-black text-[#d5a756]">Jam Operasional</h2>
              <p className="mt-4 text-lg font-bold text-[#f0cf87]">
                Senin - Minggu
              </p>
              <p className="mt-2 text-zinc-400">
                {settings?.footerOperationalHours ||
                  "08:00 - 23:00 WIB. Pesan bantuan diproses sesuai antrean."}
              </p>
              {page.note && (
                <div className="mt-5 rounded-lg border border-[#d5a756]/15 bg-black/20 p-4 text-sm font-bold text-zinc-300">
                  {page.note}
                </div>
              )}
            </div>
          </section>
        </main>
        <PublicFooter
          logo={settings?.logo}
          settings={settings}
          paymentLogos={paymentLogos}
        />
        <WhatsAppWidget
          phone={settings?.footerWhatsapp || settings?.waGatewaySender}
        />
      </div>
    );
  }

  return (
    <div key={pagePath} className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar active={fallback.label} logo={settings?.logo} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
        <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#d5a756]/15 bg-[#17130f]">
          <div className="border-b border-[#d5a756]/15 bg-black/20 p-8 md:p-10">
            <div className="text-sm text-zinc-300">
              <Link to="/" className="hover:text-[#f0cf87]">
                Beranda
              </Link>
              <span className="mx-3">/</span>
              <span className="font-bold text-[#f0cf87]">
                {fallback.label}
              </span>
            </div>
            <h1 className="mt-10 text-3xl font-black text-[#d5a756] md:text-5xl">
              {fallback.label}
            </h1>
            <p className="mt-5 text-lg leading-8 text-zinc-100">
              {showLoadingState ? fallback.intro : page.intro}
            </p>
          </div>

          <div className="p-8 md:p-10">
            {showLoadingState ? (
              <LegalSkeleton />
            ) : (
              <div className="space-y-4">
                {legalPoints(page.content).map((point, index) => (
                  <div
                    key={`${fallback.type}-${index}-${point}`}
                    className="grid gap-4 rounded-xl border border-[#d5a756]/15 bg-black/20 p-4 sm:grid-cols-[52px_1fr] sm:p-5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d5a756] text-lg font-black text-[#14100b]">
                      {index + 1}
                    </div>
                    <p className="text-lg leading-8 text-zinc-100">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {page.note && (
              <div className="mt-10 rounded-lg border border-[#d5a756]/15 bg-black/20 p-5 font-bold text-zinc-100">
                {page.note}
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter
        logo={settings?.logo}
        settings={settings}
        paymentLogos={paymentLogos}
      />
      <WhatsAppWidget
        phone={settings?.footerWhatsapp || settings?.waGatewaySender}
      />
    </div>
  );
}

function ContactCard({ label, value, type }) {
  const href =
    type === "mailto"
      ? `mailto:${value}`
      : type === "wa"
        ? `https://wa.me/${String(value).replace(/\D/g, "")}`
        : type === "phone"
          ? `tel:${value}`
          : null;

  const content = (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5 transition hover:border-[#d5a756]/50">
      <p className="text-sm font-bold text-zinc-400">{label}</p>
      <p className="mt-1 break-words font-bold text-zinc-100">
        {value}
      </p>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      target={type === "wa" ? "_blank" : undefined}
      rel={type === "wa" ? "noreferrer" : undefined}
    >
      {content}
    </a>
  );
}

function LegalSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="grid animate-pulse gap-4 rounded-xl border border-[#d5a756]/15 bg-black/20 p-4 sm:grid-cols-[52px_1fr] sm:p-5"
        >
          <div className="h-12 w-12 rounded-full bg-[#d5a756]/30" />
          <div className="space-y-3">
            <div className="h-5 w-3/4 rounded bg-white/10" />
            <div className="h-5 w-full rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
      />
    </label>
  );
}
