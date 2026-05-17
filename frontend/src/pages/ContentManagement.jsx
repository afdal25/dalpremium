import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import FilePicker from "../components/FilePicker";
import { assetUrl as imageUrl } from "../utils/url";

const legalPages = [
  {
    type: "TERMS",
    title: "Syarat & Ketentuan",
    intro: "Kelola halaman /syarat-ketentuan.",
  },
  {
    type: "PRIVACY",
    title: "Kebijakan Privasi",
    intro: "Kelola halaman /kebijakan-privasi.",
  },
  {
    type: "HELP",
    title: "Bantuan",
    intro: "Kelola halaman /bantuan.",
  },
];

const buildHelpForm = (settings = {}) => ({
  footerEmail: settings.footerEmail || "",
  footerPhone: settings.footerPhone || "",
  footerWhatsapp: settings.footerWhatsapp || "",
  footerAddress: settings.footerAddress || "",
  footerSocialInstagram: settings.footerSocialInstagram || "",
  footerSocialTiktok: settings.footerSocialTiktok || "",
  footerSocialYoutube: settings.footerSocialYoutube || "",
  footerSocialTelegram: settings.footerSocialTelegram || "",
  footerOperationalHours: settings.footerOperationalHours || "",
});

export default function ContentManagement() {
  const [content, setContent] = useState({
    settings: null,
    banners: [],
    testimonials: [],
    faqs: [],
    paymentMethods: [],
    articles: [],
    legalDocuments: [],
  });
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [testimonialFile, setTestimonialFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [faqForm, setFaqForm] = useState({
    questionId: "",
    answerId: "",
    questionEn: "",
    answerEn: "",
    sortOrder: 0,
  });
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    name: "",
    accountNumber: "",
    accountName: "",
    instructions: "",
    sortOrder: 0,
  });
  const [paymentLogoFile, setPaymentLogoFile] =
    useState(null);
  const [paymentQrisFile, setPaymentQrisFile] =
    useState(null);
  const [editingPaymentId, setEditingPaymentId] =
    useState(null);
  const [articleForm, setArticleForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    isActive: true,
  });
  const [articleFile, setArticleFile] = useState(null);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [legalForm, setLegalForm] = useState({
    type: "TERMS",
    title: "",
    intro: "",
    content: "",
    note: "",
    isActive: true,
  });
  const [editingLegalId, setEditingLegalId] = useState(null);
  const [helpForm, setHelpForm] = useState({
    footerEmail: "",
    footerPhone: "",
    footerWhatsapp: "",
    footerAddress: "",
    footerSocialInstagram: "",
    footerSocialTiktok: "",
    footerSocialYoutube: "",
    footerSocialTelegram: "",
    footerOperationalHours: "",
  });

  const loadContent = async () => {
    const response = await api.get("/content/admin");
    setContent(response.data);
    setHelpForm(buildHelpForm(response.data.settings));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        const response = await api.get("/content/admin");

        if (isMounted) {
          setContent(response.data);
          setHelpForm(buildHelpForm(response.data.settings));
        }
      } catch {
        toast.error("Gagal memuat content");
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const uploadImage = async (type) => {
    const file = type === "banners" ? bannerFile : testimonialFile;

    if (!file) {
      toast.error("Pilih gambar dulu");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("image", file);

      await api.post(`/content/${type}`, formData);

      if (type === "banners") {
        setBannerFile(null);
      } else {
        setTestimonialFile(null);
      }

      toast.success("Gambar berhasil ditambahkan");
      loadContent();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal upload gambar"
      );
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) {
      toast.error("Pilih logo dulu");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("logo", logoFile);
      const response = await api.put("/settings/logo", formData);
      setLogoFile(null);
      toast.success("Logo berhasil diperbarui");
      loadContent();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal upload logo"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (type, id) => {
    try {
      await api.delete(
        type === "payment-methods"
          ? `/payment-methods/${id}`
          : `/content/${type}/${id}`
      );
      toast.success("Data berhasil dihapus");
      loadContent();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menghapus data"
      );
    }
  };

  const resetFaq = () => {
    setFaqForm({
      questionId: "",
      answerId: "",
      questionEn: "",
      answerEn: "",
      sortOrder: 0,
    });
    setEditingFaqId(null);
  };

  const saveFaq = async () => {
    if (!faqForm.questionId || !faqForm.answerId) {
      toast.error("FAQ Indonesia wajib diisi");
      return;
    }

    try {
      setLoading(true);

      if (editingFaqId) {
        await api.put(`/content/faqs/${editingFaqId}`, {
          ...faqForm,
          isActive: true,
        });
      } else {
        await api.post("/content/faqs", faqForm);
      }

      toast.success("FAQ berhasil disimpan");
      resetFaq();
      loadContent();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menyimpan FAQ"
      );
    } finally {
      setLoading(false);
    }
  };

  const editFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqForm({
      questionId: faq.questionId || "",
      answerId: faq.answerId || "",
      questionEn: faq.questionEn || "",
      answerEn: faq.answerEn || "",
      sortOrder: faq.sortOrder || 0,
    });
  };

  const resetPayment = () => {
    setPaymentForm({
      name: "",
      accountNumber: "",
      accountName: "",
      instructions: "",
      sortOrder: 0,
    });
    setPaymentLogoFile(null);
    setPaymentQrisFile(null);
    setEditingPaymentId(null);
  };

  const buildPaymentFormData = () => {
    const formData = new FormData();

    Object.entries(paymentForm).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });

    formData.append("isActive", "true");

    if (paymentLogoFile) {
      formData.append("logo", paymentLogoFile);
    }

    if (paymentQrisFile) {
      formData.append("qrisImage", paymentQrisFile);
    }

    return formData;
  };

  const savePayment = async () => {
    if (
      !paymentForm.name ||
      !paymentForm.accountNumber ||
      !paymentForm.accountName
    ) {
      toast.error("Data metode pembayaran wajib diisi");
      return;
    }

    try {
      setLoading(true);

      if (editingPaymentId) {
        await api.put(
          `/payment-methods/${editingPaymentId}`,
          buildPaymentFormData()
        );
      } else {
        await api.post(
          "/payment-methods",
          buildPaymentFormData()
        );
      }

      toast.success("Metode pembayaran disimpan");
      resetPayment();
      loadContent();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menyimpan metode pembayaran"
      );
    } finally {
      setLoading(false);
    }
  };

  const editPayment = (method) => {
    setEditingPaymentId(method.id);
    setPaymentForm({
      name: method.name || "",
      accountNumber: method.accountNumber || "",
      accountName: method.accountName || "",
      instructions: method.instructions || "",
      sortOrder: method.sortOrder || 0,
    });
    setPaymentLogoFile(null);
    setPaymentQrisFile(null);
  };

  const resetArticle = () => {
    setArticleForm({
      title: "",
      excerpt: "",
      content: "",
      isActive: true,
    });
    setArticleFile(null);
    setEditingArticleId(null);
  };

  const saveArticle = async () => {
    if (!articleForm.title || !articleForm.content) {
      toast.error("Judul dan isi artikel wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(articleForm).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (articleFile) {
        formData.append("image", articleFile);
      }

      if (editingArticleId) {
        await api.put(`/content/articles/${editingArticleId}`, formData);
      } else {
        await api.post("/content/articles", formData);
      }

      toast.success("Artikel berhasil disimpan");
      resetArticle();
      loadContent();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menyimpan artikel"
      );
    } finally {
      setLoading(false);
    }
  };

  const editArticle = (article) => {
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      isActive: article.isActive,
    });
    setArticleFile(null);
  };

  const resetLegal = () => {
    setLegalForm({
      type: "TERMS",
      title: "",
      intro: "",
      content: "",
      note: "",
      isActive: true,
    });
    setEditingLegalId(null);
  };

  const saveLegal = async () => {
    if (!legalForm.type || !legalForm.title || !legalForm.intro || !legalForm.content) {
      toast.error("Tipe, judul, intro, dan isi halaman wajib diisi");
      return;
    }

    try {
      setLoading(true);

      if (editingLegalId) {
        await api.put(`/content/legal-documents/${editingLegalId}`, legalForm);
      } else {
        await api.post("/content/legal-documents", legalForm);
      }

      toast.success("Halaman informasi berhasil disimpan");
      resetLegal();
      loadContent();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menyimpan halaman informasi"
      );
    } finally {
      setLoading(false);
    }
  };

  const editLegal = (document) => {
    setEditingLegalId(document.id);
    setLegalForm({
      type: document.type || "TERMS",
      title: document.title || "",
      intro: document.intro || "",
      content: document.content || "",
      note: document.note || "",
      isActive: document.isActive,
    });
  };

  const saveHelpSettings = async () => {
    try {
      setLoading(true);
      await api.put("/settings", {
        ...(content.settings || {}),
        ...helpForm,
      });
      toast.success("Konten bantuan berhasil disimpan");
      loadContent();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menyimpan konten bantuan"
      );
    } finally {
      setLoading(false);
    }
  };

  const startLegalPage = (page) => {
    const document = content.legalDocuments.find(
      (item) => item.type === page.type
    );

    if (document) {
      editLegal(document);
      return;
    }

    setEditingLegalId(null);
    setLegalForm({
      type: page.type,
      title: page.title,
      intro: "",
      content: "",
      note: "",
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-[#d5a756]">
          Shop Content
        </p>
        <h1 className="text-3xl font-black">
          Banner, Testimoni, FAQ
        </h1>
      </div>

      <section className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
        <h2 className="text-xl font-black">Logo Website</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-[#d5a756]/20 bg-black">
            {content.settings?.logo ? (
              <img
                src={imageUrl(content.settings.logo)}
                alt="Logo"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="h-full w-full opacity-0" />
              </div>
            )}
          </div>
          <FilePicker file={logoFile} onChange={setLogoFile} />
          <button
            type="button"
            onClick={uploadLogo}
            disabled={loading}
            className="rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] disabled:opacity-60"
          >
            Simpan Logo
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
        <h2 className="text-xl font-black">Banner Header</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <FilePicker file={bannerFile} onChange={setBannerFile} />
          <button
            type="button"
            onClick={() => uploadImage("banners")}
            disabled={loading}
            className="rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] disabled:opacity-60"
          >
            Upload Banner
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {content.banners.map((banner) => (
            <div
              key={banner.id}
              className="overflow-hidden rounded-lg border border-white/10 bg-black/20"
            >
              <img
                src={imageUrl(banner.image)}
                alt="Banner"
                className="h-40 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => deleteItem("banners", banner.id)}
                className="w-full px-4 py-3 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"
              >
                Hapus Banner
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
        <h2 className="text-xl font-black">Foto Testimoni</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <FilePicker
            file={testimonialFile}
            onChange={setTestimonialFile}
          />
          <button
            type="button"
            onClick={() => uploadImage("testimonials")}
            disabled={loading}
            className="rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] disabled:opacity-60"
          >
            Upload Testimoni
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {content.testimonials.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg border border-white/10 bg-black/20"
            >
              <img
                src={imageUrl(item.image)}
                alt="Testimoni"
                className="h-44 w-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  deleteItem("testimonials", item.id)
                }
                className="w-full px-4 py-3 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"
              >
                Hapus Foto
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
        <h2 className="text-xl font-black">FAQ</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={faqForm.questionId}
            onChange={(event) =>
              setFaqForm({
                ...faqForm,
                questionId: event.target.value,
              })
            }
            placeholder="Pertanyaan Indonesia"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={faqForm.questionEn}
            onChange={(event) =>
              setFaqForm({
                ...faqForm,
                questionEn: event.target.value,
              })
            }
            placeholder="Question English"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <textarea
            value={faqForm.answerId}
            onChange={(event) =>
              setFaqForm({
                ...faqForm,
                answerId: event.target.value,
              })
            }
            placeholder="Jawaban Indonesia"
            className="min-h-28 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756]"
          />
          <textarea
            value={faqForm.answerEn}
            onChange={(event) =>
              setFaqForm({
                ...faqForm,
                answerEn: event.target.value,
              })
            }
            placeholder="Answer English"
            className="min-h-28 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756]"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={saveFaq}
            disabled={loading}
            className="rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] disabled:opacity-60"
          >
            {editingFaqId ? "Update FAQ" : "Tambah FAQ"}
          </button>
          {editingFaqId && (
            <button
              type="button"
              onClick={resetFaq}
              className="rounded-lg border border-white/10 px-5 py-3 font-black text-zinc-200"
            >
              Batal
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3">
          {content.faqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <p className="font-black">{faq.questionId}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {faq.answerId}
              </p>
              {faq.questionEn && (
                <p className="mt-3 text-sm font-bold text-[#d5a756]">
                  EN: {faq.questionEn}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => editFaq(faq)}
                  className="rounded-lg border border-[#d5a756]/25 px-4 py-2 text-sm font-bold text-[#f0cf87]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem("faqs", faq.id)}
                  className="rounded-lg border border-red-500/25 px-4 py-2 text-sm font-bold text-red-300"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
        <h2 className="text-xl font-black">Metode Pembayaran</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={paymentForm.name}
            onChange={(event) =>
              setPaymentForm({
                ...paymentForm,
                name: event.target.value,
              })
            }
            placeholder="Nama metode, contoh BCA / DANA"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={paymentForm.accountNumber}
            onChange={(event) =>
              setPaymentForm({
                ...paymentForm,
                accountNumber: event.target.value,
              })
            }
            placeholder="Nomor rekening / nomor e-wallet"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={paymentForm.accountName}
            onChange={(event) =>
              setPaymentForm({
                ...paymentForm,
                accountName: event.target.value,
              })
            }
            placeholder="Atas nama"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            type="number"
            value={paymentForm.sortOrder}
            onChange={(event) =>
              setPaymentForm({
                ...paymentForm,
                sortOrder: event.target.value,
              })
            }
            placeholder="Urutan"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <textarea
            value={paymentForm.instructions}
            onChange={(event) =>
              setPaymentForm({
                ...paymentForm,
                instructions: event.target.value,
              })
            }
            placeholder="Instruksi tambahan"
            className="min-h-24 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756] md:col-span-2"
          />
          <label className="rounded-lg border border-dashed border-[#d5a756]/25 bg-black/20 p-4 text-sm text-zinc-300">
            <span className="block font-bold text-[#f0cf87]">
              Logo rekening / e-wallet
            </span>
            <span className="mt-1 block text-xs text-zinc-500">
              Dipakai di pilihan metode pembayaran.
            </span>
            <FilePicker
              file={paymentLogoFile}
              onChange={setPaymentLogoFile}
              className="mt-3"
            />
          </label>
          <label className="rounded-lg border border-dashed border-[#d5a756]/25 bg-black/20 p-4 text-sm text-zinc-300">
            <span className="block font-bold text-[#f0cf87]">
              Foto QRIS
            </span>
            <span className="mt-1 block text-xs text-zinc-500">
              Opsional, tampil saat customer memilih QRIS.
            </span>
            <FilePicker
              file={paymentQrisFile}
              onChange={setPaymentQrisFile}
              className="mt-3"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={savePayment}
            disabled={loading}
            className="rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] disabled:opacity-60"
          >
            {editingPaymentId
              ? "Update Metode"
              : "Tambah Metode"}
          </button>
          {editingPaymentId && (
            <button
              type="button"
              onClick={resetPayment}
              className="rounded-lg border border-white/10 px-5 py-3 font-black text-zinc-200"
            >
              Batal
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {content.paymentMethods.map((method) => (
            <div
              key={method.id}
              className="rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <p className="text-lg font-black">{method.name}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {method.accountNumber} a/n {method.accountName}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {method.logo && (
                  <img
                    src={imageUrl(method.logo)}
                    alt={method.name}
                    className="h-14 w-20 rounded-lg border border-white/10 bg-white object-contain p-2"
                  />
                )}
                {method.qrisImage && (
                  <img
                    src={imageUrl(method.qrisImage)}
                    alt={`${method.name} QRIS`}
                    className="h-20 w-20 rounded-lg border border-white/10 bg-white object-contain p-1"
                  />
                )}
              </div>
              {method.instructions && (
                <p className="mt-2 text-sm text-zinc-500">
                  {method.instructions}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => editPayment(method)}
                  className="rounded-lg border border-[#d5a756]/25 px-4 py-2 text-sm font-bold text-[#f0cf87]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    deleteItem("payment-methods", method.id)
                  }
                  className="rounded-lg border border-red-500/25 px-4 py-2 text-sm font-bold text-red-300"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
        <h2 className="text-xl font-black">Artikel</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={articleForm.title}
            onChange={(event) =>
              setArticleForm({
                ...articleForm,
                title: event.target.value,
              })
            }
            placeholder="Judul artikel"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <FilePicker file={articleFile} onChange={setArticleFile} />
          <textarea
            value={articleForm.excerpt}
            onChange={(event) =>
              setArticleForm({
                ...articleForm,
                excerpt: event.target.value,
              })
            }
            placeholder="Ringkasan artikel"
            className="min-h-20 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756] md:col-span-2"
          />
          <textarea
            value={articleForm.content}
            onChange={(event) =>
              setArticleForm({
                ...articleForm,
                content: event.target.value,
              })
            }
            placeholder="Isi artikel"
            className="min-h-36 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756] md:col-span-2"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={saveArticle}
            disabled={loading}
            className="rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] disabled:opacity-60"
          >
            {editingArticleId ? "Update Artikel" : "Tambah Artikel"}
          </button>
          {editingArticleId && (
            <button
              type="button"
              onClick={resetArticle}
              className="rounded-lg border border-white/10 px-5 py-3 font-black text-zinc-200"
            >
              Batal
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {content.articles.map((article) => (
            <div
              key={article.id}
              className="overflow-hidden rounded-lg border border-white/10 bg-black/20"
            >
              <div className="aspect-[16/9] bg-black/30">
                {article.image ? (
                  <img
                    src={imageUrl(article.image)}
                    alt={article.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-black text-[#d5a756]/30">
                    {article.title?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-lg font-black">{article.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                  {article.excerpt || article.content}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => editArticle(article)}
                    className="rounded-lg border border-[#d5a756]/25 px-4 py-2 text-sm font-bold text-[#f0cf87]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem("articles", article.id)}
                    className="rounded-lg border border-red-500/25 px-4 py-2 text-sm font-bold text-red-300"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
        <h2 className="text-xl font-black">
          Halaman Informasi
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Tiap halaman punya data sendiri. Mengubah Bantuan tidak akan mengubah Syarat & Ketentuan.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {legalPages.map((page) => {
            const document = content.legalDocuments.find(
              (item) => item.type === page.type
            );

            return (
              <button
                key={page.type}
                type="button"
                onClick={() => startLegalPage(page)}
                className={`rounded-lg border p-4 text-left transition ${
                  legalForm.type === page.type
                    ? "border-[#d5a756] bg-[#d5a756]/10"
                    : "border-white/10 bg-black/20 hover:border-[#d5a756]/40"
                }`}
              >
                <p className="font-black text-[#f0cf87]">{page.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{page.intro}</p>
                <span className="mt-3 inline-flex rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-zinc-300">
                  {document ? "Sudah ada" : "Belum diisi"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={
              legalPages.find((page) => page.type === legalForm.type)?.title ||
              legalForm.type
            }
            readOnly
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 text-zinc-400 outline-none"
          />
          <input
            value={legalForm.title}
            onChange={(event) =>
              setLegalForm({
                ...legalForm,
                title: event.target.value,
              })
            }
            placeholder="Judul halaman"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <textarea
            value={legalForm.intro}
            onChange={(event) =>
              setLegalForm({
                ...legalForm,
                intro: event.target.value,
              })
            }
            placeholder="Intro / sub judul halaman"
            className="min-h-24 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756] md:col-span-2"
          />
          <textarea
            value={legalForm.content}
            onChange={(event) =>
              setLegalForm({
                ...legalForm,
                content: event.target.value,
              })
            }
            placeholder={"Isi poin halaman. Tulis satu poin per baris, contoh:\nPengguna wajib mengisi data yang benar.\nPembayaran diproses setelah bukti bayar diterima.\nProduk digital tidak bisa dibatalkan setelah diproses."}
            className="min-h-44 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756] md:col-span-2"
          />
          <p className="-mt-1 text-xs font-semibold text-zinc-500 md:col-span-2">
            Setiap baris akan tampil sebagai poin bernomor di halaman publik.
          </p>
          <textarea
            value={legalForm.note}
            onChange={(event) =>
              setLegalForm({
                ...legalForm,
                note: event.target.value,
              })
            }
            placeholder="Catatan penutup, opsional"
            className="min-h-20 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756] md:col-span-2"
          />
          <label className="flex items-center gap-3 text-sm font-bold text-zinc-300">
            <input
              type="checkbox"
              checked={legalForm.isActive}
              onChange={(event) =>
                setLegalForm({
                  ...legalForm,
                  isActive: event.target.checked,
                })
              }
            />
            Aktifkan halaman
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={saveLegal}
            disabled={loading}
            className="rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] disabled:opacity-60"
          >
            {editingLegalId ? "Update Halaman" : "Simpan Halaman"}
          </button>
          {editingLegalId && (
            <button
              type="button"
              onClick={resetLegal}
              className="rounded-lg border border-white/10 px-5 py-3 font-black text-zinc-200"
            >
              Batal
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {legalPages.map((page) => {
            const document = content.legalDocuments.find(
              (item) => item.type === page.type
            );

            if (!document) {
              return null;
            }

            return (
            <div
              key={document.id}
              className="rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <p className="text-xs font-black text-[#d5a756]">
                {document.type}
              </p>
              <p className="mt-1 text-lg font-black">{document.title}</p>
              <p className="mt-2 line-clamp-3 text-sm text-zinc-400">
                {document.intro}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => editLegal(document)}
                  className="rounded-lg border border-[#d5a756]/25 px-4 py-2 text-sm font-bold text-[#f0cf87]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    deleteItem("legal-documents", document.id)
                  }
                  className="rounded-lg border border-red-500/25 px-4 py-2 text-sm font-bold text-red-300"
                >
                  Hapus
                </button>
              </div>
            </div>
          );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[#d5a756]/15 bg-[#17130f] p-5">
        <h2 className="text-xl font-black">Bantuan</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Isi informasi kontak, media sosial, dan jam operasional untuk halaman Bantuan.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={helpForm.footerEmail}
            onChange={(event) =>
              setHelpForm({ ...helpForm, footerEmail: event.target.value })
            }
            placeholder="Email bantuan"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={helpForm.footerPhone}
            onChange={(event) =>
              setHelpForm({ ...helpForm, footerPhone: event.target.value })
            }
            placeholder="Telepon"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={helpForm.footerWhatsapp}
            onChange={(event) =>
              setHelpForm({ ...helpForm, footerWhatsapp: event.target.value })
            }
            placeholder="WhatsApp bantuan"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={helpForm.footerAddress}
            onChange={(event) =>
              setHelpForm({ ...helpForm, footerAddress: event.target.value })
            }
            placeholder="Alamat"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={helpForm.footerSocialInstagram}
            onChange={(event) =>
              setHelpForm({
                ...helpForm,
                footerSocialInstagram: event.target.value,
              })
            }
            placeholder="Instagram"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={helpForm.footerSocialTiktok}
            onChange={(event) =>
              setHelpForm({
                ...helpForm,
                footerSocialTiktok: event.target.value,
              })
            }
            placeholder="TikTok"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={helpForm.footerSocialYoutube}
            onChange={(event) =>
              setHelpForm({
                ...helpForm,
                footerSocialYoutube: event.target.value,
              })
            }
            placeholder="YouTube"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <input
            value={helpForm.footerSocialTelegram}
            onChange={(event) =>
              setHelpForm({
                ...helpForm,
                footerSocialTelegram: event.target.value,
              })
            }
            placeholder="Telegram"
            className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 outline-none focus:border-[#d5a756]"
          />
          <textarea
            value={helpForm.footerOperationalHours}
            onChange={(event) =>
              setHelpForm({
                ...helpForm,
                footerOperationalHours: event.target.value,
              })
            }
            placeholder="Jam operasional"
            className="min-h-24 rounded-lg border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-[#d5a756] md:col-span-2"
          />
        </div>
        <button
          type="button"
          onClick={saveHelpSettings}
          disabled={loading}
          className="mt-4 rounded-lg bg-[#d5a756] px-5 py-3 font-black text-[#14100b] disabled:opacity-60"
        >
          Simpan Bantuan
        </button>
      </section>
    </div>
  );
}
