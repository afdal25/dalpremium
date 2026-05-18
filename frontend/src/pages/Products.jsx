import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import FilePicker from "../components/FilePicker";
import { optimizedImageUrl } from "../utils/url";
import {
  exportRowsToCsv,
  exportRowsToPdf,
  exportRowsToXlsx,
} from "../utils/exportFiles";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [openExport, setOpenExport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "",
    plan: "",
    categoryId: "",
    description: "",
    image: "",
    deliveryType: "INVITE",
    isActive: true,
  });

  const productParams = {
    stock: false,
    page: currentPage,
    limit: itemsPerPage,
    search: search.trim() || undefined,
    delivery: deliveryFilter === "ALL" ? undefined : deliveryFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  };

  const fetchProducts = async (params = productParams) => {
    try {
      setLoading(true);
      const response = await api.get("/products", {
        params,
      });
      const data = response.data;
      const nextProducts = Array.isArray(data) ? data : data.items || [];

      setProducts(nextProducts);
      setTotalProducts(
        Array.isArray(data) ? nextProducts.length : data.total || 0
      );
    } catch {
      toast.error("Gagal mengambil product");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/product-categories");
      setCategories(response.data);
    } catch {
      toast.error("Gagal mengambil kategori");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const categoriesResponse = await api.get("/product-categories");

        if (isMounted) {
          setCategories(categoriesResponse.data);
        }
      } catch {
        if (isMounted) {
          toast.error("Gagal mengambil kategori");
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        fetchProducts();
      },
      search.trim() ? 250 : 0
    );

    return () => window.clearTimeout(timeout);
  }, [
    currentPage,
    itemsPerPage,
    search,
    deliveryFilter,
    statusFilter,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextForm = {
      ...form,
      [name]: type === "checkbox" ? checked : value,
    };

    if (name === "name") {
      const template = products.find(
        (item) =>
          item.name.toLowerCase() === value.trim().toLowerCase()
      );

      if (template) {
        nextForm.description =
          nextForm.description || template.description || "";
        nextForm.image = nextForm.image || template.image || "";
        nextForm.categoryId =
          nextForm.categoryId || template.categoryId || "";
      }
    }

    setForm(nextForm);
  };

  const productTemplates = useMemo(() => Array.from(
    products
      .reduce((templates, item) => {
        if (!templates.has(item.name)) {
          templates.set(item.name, item);
        }

        return templates;
      }, new Map())
      .values()
  ), [products]);

  const useProductTemplate = (productName) => {
    if (!productName) {
      return;
    }

    const template = productTemplates.find(
      (item) => item.name === productName
    );

    if (!template) {
      return;
    }

    setForm((current) => ({
      ...current,
      name: template.name,
      description: template.description || "",
      image: template.image || "",
      categoryId: template.categoryId || "",
    }));
    setImageFile(null);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditData({
      ...editData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addProduct = async () => {
    if (!form.name || !form.price || !form.duration || !form.plan) {
      toast.error("Nama product, durasi, plan, dan harga wajib diisi");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });

      if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      await api.post("/products", formData);

      toast.success("Product berhasil ditambahkan");

      setForm({
        name: form.name,
        price: "",
        duration: "",
        plan: "",
        categoryId: form.categoryId,
        description: form.description,
        image: form.image,
        deliveryType: form.deliveryType,
        isActive: true,
      });
      setImageFile(null);

      fetchProducts();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menambahkan product"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async () => {
    if (!editData.name || !editData.price || !editData.duration || !editData.plan) {
      toast.error("Nama product, durasi, plan, dan harga wajib diisi");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(editData).forEach(([key, value]) => {
        if (key !== "category" && value !== undefined) {
          formData.append(key, value ?? "");
        }
      });

      if (editImageFile) {
        formData.append("imageFile", editImageFile);
      }

      await api.put(`/products/${editData.id}`, formData);

      toast.success("Product berhasil diupdate");

      setEditData(null);
      setEditImageFile(null);
      fetchProducts();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal update product"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async () => {
    try {
      setLoading(true);

      await api.delete(`/products/${deleteId}`);

      toast.success("Product berhasil dihapus");

      setDeleteId(null);
      fetchProducts();
    } catch {
      toast.error("Gagal menghapus product");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const paginatedProducts = products;

  const getExportProducts = async () => {
    const response = await api.get("/products", {
      params: {
        ...productParams,
        page: 1,
        limit: 5000,
      },
    });

    return response.data.items || [];
  };

  const buildExportRows = (rows) =>
    rows.map((item) => ({
      Name: item.name,
      Category: item.category?.name || "-",
      Duration: item.duration || "-",
      Plan: item.plan || "-",
      Price: item.price,
      Type: item.deliveryType,
      Status: item.isActive ? "ACTIVE" : "INACTIVE",
      Description: item.description || "-",
    }));

  const exportExcel = async () => {
    const rows = buildExportRows(await getExportProducts());
    await exportRowsToXlsx(rows, "products.xlsx", "Products");
    toast.success("Excel berhasil di-export");
  };

  const exportPDF = async () => {
    const rows = await getExportProducts();

    await exportRowsToPdf({
      title: "Laporan Products",
      headers: ["Name", "Category", "Duration", "Plan", "Price", "Type", "Status"],
      rows: rows.map((item) => [
        item.name,
        item.category?.name || "-",
        item.duration || "-",
        item.plan || "-",
        `Rp ${Number(item.price).toLocaleString()}`,
        item.deliveryType,
        item.isActive ? "ACTIVE" : "INACTIVE",
      ]),
      filename: "products.pdf",
    });
    toast.success("PDF berhasil di-export");
  };

  const exportCSV = async () => {
    const rows = buildExportRows(await getExportProducts());
    exportRowsToCsv(rows, "products.csv");
    toast.success("CSV berhasil di-export");
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    try {
      setLoading(true);

      if (editingCategory) {
        await api.put(`/product-categories/${editingCategory.id}`, {
          name: categoryName,
          isActive: editingCategory.isActive,
        });
        toast.success("Kategori berhasil diupdate");
      } else {
        await api.post("/product-categories", {
          name: categoryName,
        });
        toast.success("Kategori berhasil ditambahkan");
      }

      setCategoryName("");
      setEditingCategory(null);
      fetchCategories();
      fetchProducts();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menyimpan kategori"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/product-categories/${id}`);
      toast.success("Kategori berhasil dihapus");
      fetchCategories();
      fetchProducts();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Gagal menghapus kategori"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Products
      </h1>

      <div className="grid gap-5 mb-8 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Total Product</p>
          <h2 className="text-2xl font-bold mt-2">{products.length}</h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Active</p>
          <h2 className="text-2xl font-bold mt-2 text-green-400">
            {products.filter((item) => item.isActive).length}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Invite Type</p>
          <h2 className="text-2xl font-bold mt-2 text-indigo-400">
            {products.filter((item) => item.deliveryType === "INVITE").length}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400">Account Type</p>
          <h2 className="text-2xl font-bold mt-2 text-yellow-400">
            {products.filter((item) => item.deliveryType === "ACCOUNT").length}
          </h2>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
        <h2 className="text-xl font-semibold mb-5">
          Kategori Produk
        </h2>

        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Nama kategori, contoh Streaming / Editing"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="min-w-0 flex-1 bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />
          <button
            onClick={saveCategory}
            disabled={loading}
            className="bg-[#d5a756] hover:bg-[#f0cf87] disabled:opacity-50 px-5 py-3 rounded-xl font-bold text-[#14100b]"
          >
            {editingCategory ? "Update Kategori" : "Tambah Kategori"}
          </button>
          {editingCategory && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryName("");
              }}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl"
            >
              Batal
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black/20 px-3 py-2"
            >
              <span className="font-semibold">{category.name}</span>
              <button
                onClick={() => {
                  setEditingCategory(category);
                  setCategoryName(category.name);
                }}
                className="text-xs font-bold text-[#f0cf87]"
              >
                Edit
              </button>
              <button
                onClick={() => deleteCategory(category.id)}
                className="text-xs font-bold text-red-300"
              >
                Hapus
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-zinc-500">
              Belum ada kategori.
            </p>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
        <h2 className="text-xl font-semibold mb-5">
          Tambah Product
        </h2>

        <div className="mb-5 rounded-xl border border-[#d5a756]/15 bg-black/20 p-4">
          <label className="mb-2 block text-sm font-bold text-[#f0cf87]">
            Tambah varian dari produk yang sudah ada
          </label>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <select
              value=""
              onChange={(event) => useProductTemplate(event.target.value)}
              className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
            >
              <option value="">Pilih produk lama untuk isi otomatis deskripsi, logo, kategori</option>
              {productTemplates.map((product) => (
                <option key={product.id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => useProductTemplate(form.name)}
              className="rounded-xl border border-[#d5a756]/25 px-4 py-3 text-sm font-black text-[#f0cf87] transition hover:bg-[#d5a756]/10"
            >
              Isi otomatis
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Kalau nama produk sama, backend juga akan memakai deskripsi, logo, dan kategori dari produk terakhir meski kolom itu dikosongkan.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <input
            name="name"
            placeholder="Nama layanan"
            value={form.name}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <input
            type="number"
            name="price"
            placeholder="Harga"
            value={form.price}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <select
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          >
            <option value="">Pilih durasi</option>
            <option value="1 Hari">1 Hari</option>
            <option value="7 Hari">7 Hari</option>
            <option value="1 Bulan">1 Bulan</option>
            <option value="3 Bulan">3 Bulan</option>
            <option value="1 Tahun">1 Tahun</option>
          </select>

          <select
            name="plan"
            value={form.plan}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          >
            <option value="">Pilih plan</option>
            <option value="1P1U">1P1U</option>
            <option value="1P2U">1P2U</option>
            <option value="1P3U">1P3U</option>
            <option value="Private">Private</option>
            <option value="Sharing">Sharing</option>
          </select>

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          >
            <option value="">Pilih kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            name="image"
            placeholder="Image URL (opsional)"
            value={form.image}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          />

          <FilePicker file={imageFile} onChange={setImageFile} />

          <select
            name="deliveryType"
            value={form.deliveryType}
            onChange={handleChange}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
          >
            <option value="INVITE">INVITE</option>
            <option value="ACCOUNT">ACCOUNT</option>
          </select>

          <textarea
            name="description"
            placeholder="Deskripsi"
            value={form.description}
            onChange={handleChange}
            className="h-24 bg-zinc-800 border border-zinc-700 rounded-xl p-3 md:col-span-2"
          />
        </div>

        <button
          onClick={addProduct}
          disabled={loading}
          className="mt-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-3 rounded-xl"
        >
          {loading ? "Loading..." : "Tambah Product"}
        </button>
      </div>

      <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <div className="flex gap-4 flex-wrap">
          <input
            placeholder="Search product..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 w-80"
          />

          <select
            value={deliveryFilter}
            onChange={(e) => {
              setDeliveryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          >
            <option value="ALL">All Type</option>
            <option value="INVITE">INVITE</option>
            <option value="ACCOUNT">ACCOUNT</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenExport(!openExport)}
            className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl"
          >
            EXPORT
          </button>

          {openExport && (
            <div className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50">
              <button
                onClick={() => {
                  exportCSV();
                  setOpenExport(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-zinc-800"
              >
                Export CSV
              </button>

              <button
                onClick={() => {
                  exportPDF();
                  setOpenExport(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-zinc-800"
              >
                Export PDF
              </button>

              <button
                onClick={() => {
                  exportExcel();
                  setOpenExport(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-zinc-800"
              >
                Export Excel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        <table className="product-table">
          <colgroup>
            <col style={{ width: "320px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "115px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "145px" }} />
          </colgroup>
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Kategori</th>
              <th className="text-left p-4">Duration</th>
              <th className="text-left p-4">Plan</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Created</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr
                  key={index}
                  className="border-t border-zinc-800 animate-pulse"
                >
                  {[...Array(9)].map((_, colIndex) => (
                    <td key={colIndex} className="p-4">
                      <div className="h-5 bg-zinc-800 rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <>
                {paginatedProducts.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-zinc-800"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={optimizedImageUrl(item.image, {
                              width: 64,
                              height: 64,
                              crop: "fill",
                              quality: "auto:low",
                            })}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
                            {item.name?.charAt(0)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold">{item.name}</p>
                          <p className="product-description text-sm text-zinc-400">
                            {item.description || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg text-sm bg-[#d5a756]/15 text-[#f0cf87]">
                        {item.category?.name || "-"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg text-sm bg-cyan-500/15 text-cyan-300">
                        {item.duration || "-"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg text-sm bg-emerald-500/15 text-emerald-300">
                        {item.plan || "-"}
                      </span>
                    </td>

                    <td className="p-4">
                      Rp {Number(item.price).toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm ${
                          item.deliveryType === "INVITE"
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {item.deliveryType}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm ${
                          item.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {item.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td className="p-4">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-4">
                      <div className="flex min-w-0 flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setEditData(item);
                            setEditImageFile(null);
                          }}
                          className="rounded-lg bg-yellow-500 px-2.5 py-2 text-xs font-black text-black hover:bg-yellow-400"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="rounded-lg bg-red-500 px-2.5 py-2 text-xs font-black hover:bg-red-400"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-10 text-center text-zinc-400"
                    >
                      Belum ada product
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-5">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">Show:</span>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <p className="text-zinc-400">
          Page {currentPage} of {totalPages || 1}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-4 py-2 rounded-lg"
          >
            Prev
          </button>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-4 py-2 rounded-lg"
          >
            Next
          </button>
        </div>
      </div>

      {editData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[600px]">
            <h2 className="text-2xl font-bold mb-5">
              Edit Product
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="name"
                value={editData.name}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <input
                type="number"
                name="price"
                value={editData.price}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <select
                name="duration"
                value={editData.duration || ""}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              >
                <option value="">Pilih durasi</option>
                <option value="1 Hari">1 Hari</option>
                <option value="7 Hari">7 Hari</option>
                <option value="1 Bulan">1 Bulan</option>
                <option value="3 Bulan">3 Bulan</option>
                <option value="1 Tahun">1 Tahun</option>
              </select>

              <select
                name="plan"
                value={editData.plan || ""}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              >
                <option value="">Pilih plan</option>
                <option value="1P1U">1P1U</option>
                <option value="1P2U">1P2U</option>
                <option value="1P3U">1P3U</option>
                <option value="Private">Private</option>
                <option value="Sharing">Sharing</option>
              </select>

              <select
                name="categoryId"
                value={editData.categoryId || ""}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                name="image"
                value={editData.image || ""}
                onChange={handleEditChange}
                placeholder="Image URL (opsional)"
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              />

              <FilePicker
                file={editImageFile}
                onChange={setEditImageFile}
              />

              <select
                name="deliveryType"
                value={editData.deliveryType}
                onChange={handleEditChange}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-3"
              >
                <option value="INVITE">INVITE</option>
                <option value="ACCOUNT">ACCOUNT</option>
              </select>

              <textarea
                name="description"
                value={editData.description || ""}
                onChange={handleEditChange}
                className="h-24 bg-zinc-800 border border-zinc-700 rounded-xl p-3 md:col-span-2"
              />

              <label className="flex items-center gap-3 text-zinc-300 md:col-span-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={editData.isActive}
                  onChange={handleEditChange}
                />
                Product Active
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditData(null)}
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={updateProduct}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 px-4 py-2 rounded-lg text-black"
              >
                {loading ? "Saving..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[400px]">
            <h2 className="text-2xl font-bold mb-3">
              Hapus Product?
            </h2>

            <p className="text-zinc-400 mb-6">
              Product ini akan dihapus permanen.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={deleteProduct}
                disabled={loading}
                className="bg-red-500 hover:bg-red-400 disabled:opacity-50 px-4 py-2 rounded-lg"
              >
                {loading ? "Deleting..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
