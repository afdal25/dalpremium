import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PublicTopBar from "../components/PublicTopBar";
import PublicFooter from "../components/PublicFooter";
import WhatsAppWidget from "../components/WhatsAppWidget";
import api from "../services/api";
import { assetUrl as imageUrl } from "../utils/url";

export default function Articles() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [settings, setSettings] = useState(null);
  const [paymentLogos, setPaymentLogos] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      const response = await api.get("/content");

      if (isMounted) {
        setArticles(response.data.articles || []);
        setSettings(response.data.settings);
        setPaymentLogos(response.data.footerPaymentLogos || []);
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return articles;
    }

    return articles.filter((article) =>
      [article.title, article.excerpt, article.content]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [articles, query]);

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar active="Artikel" logo={settings?.logo} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
        <section className="rounded-2xl border border-[#d5a756]/15 bg-[#17130f] p-6 lg:p-10">
          <a href="/" className="text-sm font-bold text-zinc-400 hover:text-[#f0cf87]">
            &lt;- Beranda
          </a>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(320px,560px)] lg:items-end">
            <div>
              <h1 className="text-4xl font-black sm:text-5xl">
                Artikel Terbaru
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
                Baca artikel terbaru, panduan, promo, dan informasi produk digital dari DALPREMIUM.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari artikel..."
                className="h-14 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#d5a756]"
              />
              <button
                type="button"
                className="h-14 rounded-lg bg-[#d5a756] px-6 font-black text-[#14100b]"
              >
                Cari
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {filteredArticles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d5a756]/25 bg-[#17130f] p-14 text-center">
              <p className="text-lg font-semibold text-zinc-500">
                Belum ada artikel yang dipublikasikan.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  className="overflow-hidden rounded-2xl border border-[#d5a756]/15 bg-[#17130f] transition hover:-translate-y-1 hover:border-[#d5a756]/40"
                >
                  <div className="aspect-[16/9] bg-black/30">
                    {article.image ? (
                      <img
                        src={imageUrl(article.image)}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl font-black text-[#d5a756]/40">
                        {article.title?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold text-[#d5a756]">
                      Artikel
                    </p>
                    <h2 className="mt-2 text-2xl font-black leading-tight">
                      {article.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                      {article.excerpt || article.content}
                    </p>
                    <div className="mt-5 border-t border-white/10 pt-4 text-xs font-bold text-zinc-500">
                      {new Date(article.createdAt).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter
        logo={settings?.logo}
        settings={settings}
        paymentLogos={paymentLogos}
      />
      <WhatsAppWidget
        phone={settings?.footerWhatsapp || settings?.waGatewaySender || "083897585959"}
      />
    </div>
  );
}
