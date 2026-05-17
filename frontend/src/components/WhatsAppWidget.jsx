import { useState } from "react";

const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length < 10) {
    return "6283897585959";
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  return digits || "6283897585959";
};

function WhatsAppIcon({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5.3 18.7 6.2 15A7.2 7.2 0 1 1 9 17.8l-3.7.9Z"
        className="fill-none stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.8c.2-.4.4-.5.8-.5h.5c.2 0 .4.1.5.4l.6 1.4c.1.3 0 .5-.2.7l-.4.5c.6 1 1.4 1.8 2.5 2.4l.6-.5c.2-.2.5-.2.7-.1l1.4.7c.3.1.4.3.4.6v.5c0 .4-.2.7-.6.8-.6.2-1.7.3-3.2-.5-1.5-.8-2.8-2-3.6-3.6-.8-1.5-.7-2.6-.5-3Z"
        className="fill-current"
      />
    </svg>
  );
}

export default function WhatsAppWidget({ phone }) {
  const [open, setOpen] = useState(false);
  const target = normalizePhone(phone);
  const message = encodeURIComponent(
    "Halo kak, saya mau tanya tentang layanan premium Dalpremium."
  );

  if (!open) {
    return (
      <div className="group fixed bottom-5 right-5 z-50 flex items-center gap-3">
        <div className="pointer-events-none hidden translate-x-2 rounded-xl border border-white/10 bg-[#141923] px-4 py-3 text-sm font-bold text-white opacity-0 shadow-2xl transition group-hover:translate-x-0 group-hover:opacity-100 sm:block">
          Butuh bantuan?
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#02c957] text-white shadow-2xl shadow-black/40"
          aria-label="Buka bantuan WhatsApp"
        >
          <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-red-500" />
          <WhatsAppIcon className="h-9 w-9" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-white/10 bg-[#141923] text-white shadow-2xl shadow-black/50">
      <div className="bg-[#02c957] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <span className="mt-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
              <WhatsAppIcon className="h-9 w-9" />
            </span>
            <div>
              <h3 className="text-3xl font-black leading-tight">
                DALPREMIUM
              </h3>
              <p className="mt-2 text-sm font-bold">
                Web beli apk premium murah, cepat, terpercaya
              </p>
              <p className="mt-2 text-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-white/70" /> Online
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-4xl leading-none"
            aria-label="Tutup bantuan"
          >
            x
          </button>
        </div>
      </div>

      <div className="border-b border-white/10 p-5">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#02c957]">
            <WhatsAppIcon className="h-6 w-6" />
          </span>
          <div className="rounded-xl bg-[#0f1219] p-4">
            <p className="font-semibold text-zinc-200">
              Halo kak, Saya dari Dalpremium.
            </p>
            <p className="mt-2 text-sm text-zinc-400">05:15</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <a
          href={`https://wa.me/${target}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-[#02c957] text-lg font-black text-white"
        >
          <WhatsAppIcon className="h-7 w-7" />
          Mulai Chat
        </a>
      </div>
    </div>
  );
}
