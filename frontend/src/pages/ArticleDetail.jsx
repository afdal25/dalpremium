import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PublicTopBar from "../components/PublicTopBar";
import api from "../services/api";
import { imageSrcSet, optimizedImageUrl } from "../utils/url";

const PublicFooter = lazy(() => import("../components/PublicFooter"));
const WhatsAppWidget = lazy(() =>
  import("../components/WhatsAppWidget")
);

const paragraphs = (text = "") =>
  text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [settings, setSettings] = useState(null);
  const [paymentLogos, setPaymentLogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        const response = await api.get(`/articles/${slug}`);

        if (isMounted) {
          setArticle(response.data.article || null);
          setSettings(response.data.settings);
          setPaymentLogos(response.data.footerPaymentLogos || []);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0d0a] text-white">
        <PublicTopBar active="Artikel" logo={settings?.logo} />
        <main className="flex min-h-[60vh] items-center justify-center">
          Memuat artikel...
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0f0d0a] text-white">
        <PublicTopBar active="Artikel" logo={settings?.logo} />
        <main className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h1 className="text-3xl font-black sm:text-4xl">Artikel tidak ditemukan</h1>
          <Link
            to="/articles"
            className="mt-6 inline-flex rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b]"
          >
            Kembali ke Artikel
          </Link>
        </main>
        <Suspense fallback={null}>
          <PublicFooter
            logo={settings?.logo}
            settings={settings}
            paymentLogos={paymentLogos}
          />
          <WhatsAppWidget
            phone={settings?.footerWhatsapp || settings?.waGatewaySender || "083897585959"}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0d0a] text-white">
      <PublicTopBar active="Artikel" logo={settings?.logo} />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <Link
          to="/articles"
          className="text-sm font-bold text-zinc-400 hover:text-[#f0cf87]"
        >
          &lt;- Kembali ke Artikel
        </Link>

        <article className="mt-8 overflow-hidden rounded-2xl border border-[#d5a756]/15 bg-[#17130f]">
          {article.image && (
            <div className="aspect-[16/11] bg-black sm:aspect-[16/8]">
              <img
                src={optimizedImageUrl(article.image, {
                  width: 960,
                  crop: "limit",
                  quality: "auto:eco",
                })}
                srcSet={imageSrcSet(article.image, [420, 720, 960, 1280], {
                  crop: "limit",
                  quality: "auto:eco",
                })}
                sizes="(max-width: 1024px) 92vw, 960px"
                alt={article.title}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width="960"
                height="540"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-10">
            <p className="text-sm font-black text-[#d5a756]">
              Artikel
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-4 text-sm font-bold text-zinc-500">
              {new Date(article.createdAt).toLocaleDateString("id-ID")}
            </p>
            {article.excerpt && (
              <p className="mt-6 rounded-xl border border-[#d5a756]/15 bg-black/20 p-5 text-lg leading-8 text-zinc-300">
                {article.excerpt}
              </p>
            )}

            <div className="mt-8 space-y-5 text-lg leading-8 text-zinc-100">
              {paragraphs(article.content).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>
      </main>

      <Suspense fallback={null}>
        <PublicFooter
          logo={settings?.logo}
          settings={settings}
          paymentLogos={paymentLogos}
        />
        <WhatsAppWidget
          phone={settings?.footerWhatsapp || settings?.waGatewaySender || "083897585959"}
        />
      </Suspense>
    </div>
  );
}
