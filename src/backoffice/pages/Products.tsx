import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Package,
  ArrowUpDown,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { productService } from "../../services/productService";
import { uploadService } from "../../services/uploadService";
import type { Product, ProductFilters, ProductInput, ProductVariant } from "../../types";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useTheme } from "../../contexts/ThemeContext";
import { getProductQuantity } from "../../utils/productHelpers";

// Opções para Cor (nome -> hex). Cores claras: borda fina cinza para contraste.
const COLOR_MAP: Record<string, string> = {
  AZUL: "#2563EB",
  "AZUL MARINHO": "#1E3A8A",
  "AZUL MÉDIO": "#60A5FA",
  BEGE: "#D4C4A8",
  CEREJA: "#9F1239",
  CORAL: "#FF7F50",
  LARANJA: "#F97316",
  MANTEIGA: "#FEF3C7",
  "OFF-WHITE": "#F8FAFC",
  PRETO: "#000000",
  "ROSA ESCURO": "#BE185D",
  VERDE: "#22C55E",
  "VERDE MILITAR": "#4D5906",
};
const LIGHT_COLORS = new Set(["OFF-WHITE", "MANTEIGA"]);
const COLOR_OPTIONS = Object.keys(COLOR_MAP);

const PATTERNS = [
  "Onça", "Oncinha", "Zebra", "Leopardo", "Animal Print",
  "Poá", "Listrado", "Xadrez", "Vichy", "Floral",
  "Folhagem", "Costela de Adão", "Coqueiros", "Tropical",
  "Fundo do Mar", "Frutas", "Caju", "Geométrico",
  "Abstrato", "Tie Dye", "Étnico", "Olho Grego",
  "Neon", "Degradê",
];

const MATERIALS = [
  "Poliamida", "Poliéster", "Lycra", "Cirrê", "Suplex",
  "Fluity", "Lurex", "Canelado", "Atoalhado", "Jacquard",
  "Tule", "Linho", "Algodão", "Viscose", "Viscolinho",
  "Crochê", "Tricô", "Renda",
];

const SIZES = [
  "PP", "P", "M", "G", "GG", "XGG",
  "36", "38", "40", "42", "44", "46", "48",
  "Único",
];

export const Products = () => {
  const { colors, theme } = useTheme();
  const queryClient = useQueryClient();

  // Estados de Filtro
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [sort, setSort] = useState("newest");
  const [sizeFilter, setSizeFilter] = useState("");
  const [localName, setLocalName] = useState("");
  const [localMinPrice, setLocalMinPrice] = useState("");
  const [localMaxPrice, setLocalMaxPrice] = useState("");

  const debouncedName = useDebounce(localName, 500);
  const debouncedMinPrice = useDebounce(localMinPrice, 500);
  const debouncedMaxPrice = useDebounce(localMaxPrice, 500);

  const filters: ProductFilters = {
    ...pagination,
    sort,
    size: sizeFilter,
    name: debouncedName,
    min_price: debouncedMinPrice,
    max_price: debouncedMaxPrice,
  };

  // Busca de Dados
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => productService.getAll(filters),
    placeholderData: keepPreviousData,
  });

  const products = data?.data || [];
  const totalCount = data?.meta?.total || 0;
  const totalPages = Math.ceil(totalCount / pagination.limit);

  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  /** Carregando produto completo ao editar (getById para trazer variantes) */
  const [isLoadingProductForEdit, setIsLoadingProductForEdit] = useState(false);

  /** Variantes do produto (cor + tamanho + qtde). Sempre edição por variantes. */
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const initialFormState = {
    name: "",
    description: "",
    price: "",
    category: "",
    images: [] as string[],
    material: "",
    pattern: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  // Mutações
  const saveMutation = useMutation({
    mutationFn: (payload: ProductInput) => {
      if (currentProduct?.id)
        return productService.update({ ...payload, id: currentProduct.id });
      return productService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
    },
    onError: () => alert("Erro ao salvar produto"),
  });

  const deleteMutation = useMutation({
    mutationFn: productService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    onError: () => alert("Erro ao excluir"),
  });

  const handleOpenModal = async (product?: Product) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        category: product.category || "",
        images: product.images || [],
        material: product.material || "",
        pattern: product.pattern || "",
      });
      setVariants(product.variants?.length ? [...product.variants] : []);
      setIsModalOpen(true);
      setIsLoadingProductForEdit(true);
      try {
        const full = await productService.getById(product.id!);
        setCurrentProduct(full);
        setFormData({
          name: full.name,
          description: full.description || "",
          price: full.price.toString(),
          category: full.category || "",
          images: full.images || [],
          material: full.material || "",
          pattern: full.pattern || "",
        });
        const list = full.variants?.length
          ? full.variants.map((v) => ({
              color: v.color,
              size: v.size,
              stock_quantity: v.stock_quantity ?? 0,
              sku: v.sku,
            }))
          : [];
        setVariants(list);
      } catch (e) {
        console.error(e);
        alert("Erro ao carregar dados do produto.");
      } finally {
        setIsLoadingProductForEdit(false);
      }
    } else {
      setCurrentProduct(null);
      setFormData(initialFormState);
      setVariants([]);
      setIsModalOpen(true);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const publicUrl = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, images: [...prev.images, publicUrl] }));
    } catch (error) {
      alert("Erro ao fazer upload da imagem.");
      console.error(error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (variants.length === 0) {
      alert("Adicione ao menos uma variante (cor + tamanho + quantidade).");
      return;
    }
    const payload: ProductInput = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      size: null,
      category: formData.category ?? "",
      images: formData.images,
      quantity: totalStock,
      material: formData.material || undefined,
      pattern: formData.pattern || undefined,
      variants: variants.map((v) => ({
        color: v.color,
        size: v.size,
        stock_quantity: Number(v.stock_quantity) || 0,
        ...(v.sku ? { sku: v.sku } : {}),
      })),
    };
    saveMutation.mutate(payload);
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { color: COLOR_OPTIONS[0] ?? "", size: SIZES[0] ?? "", stock_quantity: 0 },
    ]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const totalStock = variants.reduce((s, v) => s + (Number(v.stock_quantity) || 0), 0);

  const handleDelete = (id: number) => {
    if (confirm("Excluir este produto?")) deleteMutation.mutate(id);
  };

  const handleExportExcel = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const btn = document.activeElement as HTMLButtonElement;
      if (btn) btn.disabled = true;

      const response = await fetch(`${API_URL}/produtos/exportar`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao exportar CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "produtos.csv";
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      if (btn) btn.disabled = false;
    } catch (error) {
      console.error(error);
      alert("Falha ao baixar relatório.");
      const btn = document.activeElement as HTMLButtonElement;
      if (btn) btn.disabled = false;
    }
  };

  // --- ESTILOS ---
  const styles = {
    // ... Mantive seus estilos anteriores ...
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
    },
    title: { fontSize: "24px", fontWeight: "bold", color: colors.text },
    primaryButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: theme === "dark" ? "#6366f1" : "#0f172a",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    excelButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "#107569",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    iconButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "5px",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: colors.muted,
    },
    filterContainer: {
      marginBottom: "20px",
      backgroundColor: colors.card,
      padding: "15px",
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
    },
    filterRow: {
      display: "flex",
      gap: "15px",
      flexWrap: "wrap" as const,
      alignItems: "center",
    },
    searchWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
      padding: "10px 15px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      flex: 2,
      minWidth: "200px",
    },
    searchInput: {
      border: "none",
      outline: "none",
      width: "100%",
      background: "transparent",
      fontSize: "14px",
      color: colors.text,
    },
    inputGroupRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flex: 1,
      minWidth: "150px",
    },
    filterInput: {
      padding: "10px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      width: "100%",
      fontSize: "14px",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
    },
    filterSelect: {
      padding: "10px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      minWidth: "120px",
      fontSize: "14px",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
    },
    tableContainer: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
      border: `1px solid ${colors.border}`,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      textAlign: "left" as const,
    },
    tableHeadRow: {
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
      borderBottom: `1px solid ${colors.border}`,
    },
    th: {
      padding: "15px",
      fontSize: "14px",
      fontWeight: "600",
      color: colors.muted,
    },
    thAction: {
      padding: "15px",
      fontSize: "14px",
      fontWeight: "600",
      color: colors.muted,
      textAlign: "right" as const,
    },
    tableRow: { borderBottom: `1px solid ${colors.border}` },
    td: { padding: "15px", fontSize: "15px", color: colors.text },
    tdCenter: {
      padding: "30px",
      textAlign: "center" as const,
      color: colors.muted,
    },
    tdAction: {
      padding: "15px",
      textAlign: "right" as const,
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
    },
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "20px",
    },
    pageButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.card,
      borderRadius: "6px",
      cursor: "pointer",
      color: colors.text,
    },
    pageButtonDisabled: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      border: `1px solid ${colors.border}`,
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
      borderRadius: "6px",
      cursor: "not-allowed",
      color: colors.muted,
    },
    modalOverlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: colors.card,
      padding: "30px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "650px",
      maxHeight: "90vh",
      overflowY: "auto" as const,
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
      border: `1px solid ${colors.border}`,
      color: colors.text,
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: colors.text,
      margin: 0,
    },
    form: { display: "flex", flexDirection: "column" as const, gap: "20px" },
    formGroup: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "8px",
    },
    label: { fontSize: "14px", fontWeight: "500", color: colors.text },
    input: {
      padding: "10px",
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      fontSize: "15px",
      outline: "none",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "10px",
    },
    secondaryButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: colors.card,
      color: colors.muted,
      border: `1px solid ${colors.border}`,
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    uploadButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      border: `1px dashed ${colors.border}`,
      borderRadius: "6px",
      cursor: "pointer",
      color: colors.muted,
      fontSize: "14px",
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
    },
    removeImageBtn: {
      position: "absolute" as const,
      top: -5,
      right: -5,
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "20px",
      height: "20px",
      fontSize: "12px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    },
    // NOVO: Estilo do Toggle
    toggleContainer: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      marginBottom: "10px",
    },
    stockGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      marginTop: "5px",
    },
  };

  if (isError)
    return (
      <div style={{ padding: "20px", color: colors.text }}>
        Erro ao carregar dados.
      </div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Produtos ({totalCount})</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportExcel} style={styles.excelButton}>
            <FileSpreadsheet size={20} /> Excel
          </button>
          <button
            onClick={() => handleOpenModal()}
            style={styles.primaryButton}
          >
            <Plus size={20} /> Novo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.filterContainer}>
        <div style={styles.filterRow}>
          <div style={styles.searchWrapper}>
            <Search size={18} color={colors.muted} />
            <input
              placeholder="Buscar nome..."
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.inputGroupRow}>
            <input
              placeholder="Min"
              type="number"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              style={styles.filterInput}
            />
            <span style={{ color: colors.muted }}>-</span>
            <input
              placeholder="Max"
              type="number"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              style={styles.filterInput}
            />
          </div>
          <select
            value={sizeFilter}
            onChange={(e) => {
              setSizeFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            style={styles.filterSelect}
          >
            <option value="">Tam. Todos</option>
            <option value="P">P</option>
            <option value="M">M</option>
            <option value="G">G</option>
            <option value="GG">GG</option>
          </select>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowUpDown
              size={16}
              color={colors.muted}
              style={{
                position: "absolute",
                left: "10px",
                pointerEvents: "none",
              }}
            />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              style={{
                ...styles.filterSelect,
                paddingLeft: "32px",
                minWidth: "160px",
              }}
            >
              <option value="newest">Recentes</option>
              <option value="qty_asc">Estoque ⬆</option>
              <option value="qty_desc">Estoque ⬇</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeadRow}>
              <th style={styles.th}>Produto</th>
              <th style={styles.th}>Preço</th>
              <th style={styles.th}>Qtd. Total</th>
              <th style={styles.th}>Img</th>
              <th style={styles.thAction}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={styles.tdCenter}>
                  <Loader2
                    className="animate-spin"
                    style={{ margin: "0 auto" }}
                  />{" "}
                  Carregando...
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: "bold" }}>{product.name}</div>
                    <div style={{ fontSize: "12px", color: colors.muted }}>
                      {product.category || "Sem categoria"}
                    </div>
                  </td>
                  <td style={styles.td}>R$ {product.price.toFixed(2)}</td>
                  <td style={styles.td}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: getProductQuantity(product) < 5 ? "#ef4444" : colors.text,
                      }}
                    >
                      <Package size={16} /> {getProductQuantity(product)}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt="Capa"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "4px",
                          objectFit: "cover",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    ) : (
                      <ImageIcon size={20} color={colors.muted} />
                    )}
                  </td>
                  <td style={styles.tdAction}>
                    <button
                      onClick={() => handleOpenModal(product)}
                      style={styles.iconButton}
                    >
                      <Edit size={18} color="#0284c7" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id!)}
                      style={styles.iconButton}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div style={styles.pagination}>
        <span style={{ color: colors.muted, fontSize: "14px" }}>
          Pág <b>{pagination.page}</b> de <b>{totalPages || 1}</b>
        </span>
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            style={
              pagination.page === 1
                ? styles.pageButtonDisabled
                : styles.pageButton
            }
          >
            <ChevronLeft size={20} />
          </button>
          <button
            disabled={pagination.page >= totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            style={
              pagination.page >= totalPages
                ? styles.pageButtonDisabled
                : styles.pageButton
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {currentProduct ? "Editar" : "Novo"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={styles.closeButton}
              >
                <X size={24} />
              </button>
            </div>
            {isLoadingProductForEdit ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", gap: "12px", color: colors.muted }}>
                <Loader2 size={24} className="animate-spin" />
                <span>Carregando produto...</span>
              </div>
            ) : (
            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Descrição</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  style={{ ...styles.input, resize: "vertical" }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="">Selecione...</option>
                  <option value="biquinis">Biquínis</option>
                  <option value="saidas">Saídas de Praia</option>
                  <option value="acessorios">Acessórios</option>
                  <option value="promocao">Promoção</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Material</label>
                <select
                  value={formData.material}
                  onChange={(e) =>
                    setFormData({ ...formData, material: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="">Selecione...</option>
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Estampa</label>
                <select
                  value={formData.pattern}
                  onChange={(e) =>
                    setFormData({ ...formData, pattern: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="">Selecione...</option>
                  {PATTERNS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* --- Estoque e Variantes --- */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Estoque e Variantes</label>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: colors.muted }}>
                    Total: <b style={{ color: colors.text }}>{totalStock}</b> unidades
                  </span>
                  <button
                    type="button"
                    onClick={addVariant}
                    style={{ ...styles.secondaryButton, padding: "6px 12px", fontSize: "13px" }}
                  >
                    <Plus size={14} /> Adicionar variante
                  </button>
                </div>
                {variants.length === 0 ? (
                  <div style={{ padding: "12px", border: `1px dashed ${colors.border}`, borderRadius: "6px", color: colors.muted, fontSize: "14px" }}>
                    Nenhuma variante. Clique em &quot;Adicionar variante&quot;.
                  </div>
                ) : (
                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: "6px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "13px" }}>
                      <thead>
                        <tr style={{ backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc", borderBottom: `1px solid ${colors.border}` }}>
                          <th style={{ ...styles.th, padding: "8px 10px" }}>Cor</th>
                          <th style={{ ...styles.th, padding: "8px 10px" }}>Tamanho</th>
                          <th style={{ ...styles.th, padding: "8px 10px" }}>Qtde</th>
                          <th style={{ ...styles.th, padding: "8px 10px", width: "44px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: "8px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {v.color && COLOR_MAP[v.color] && (
                                  <span
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      borderRadius: "50%",
                                      backgroundColor: COLOR_MAP[v.color],
                                      border: LIGHT_COLORS.has(v.color) ? `1px solid ${colors.border}` : "none",
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <select
                                  value={v.color}
                                  onChange={(e) => updateVariant(idx, "color", e.target.value)}
                                  style={{ ...styles.input, padding: "6px 8px", minWidth: "120px" }}
                                >
                                  {COLOR_OPTIONS.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <select
                                value={v.size}
                                onChange={(e) => updateVariant(idx, "size", e.target.value)}
                                style={{ ...styles.input, padding: "6px 8px", minWidth: "80px" }}
                              >
                                {SIZES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <input
                                type="number"
                                min={0}
                                value={v.stock_quantity === 0 ? "" : v.stock_quantity}
                                onChange={(e) => updateVariant(idx, "stock_quantity", Number(e.target.value) || 0)}
                                style={{ ...styles.input, padding: "6px 8px", width: "70px" }}
                              />
                            </td>
                            <td style={{ padding: "8px" }}>
                              <button
                                type="button"
                                onClick={() => removeVariant(idx)}
                                style={styles.iconButton}
                                title="Remover variante"
                              >
                                <Trash2 size={16} color="#ef4444" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Imagens</label>
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    disabled={isUploading}
                  />
                  <label htmlFor="image-upload" style={styles.uploadButton}>
                    {isUploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    {isUploading ? "Enviando..." : "Carregar Imagem"}
                  </label>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {formData.images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "60px",
                        height: "60px",
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={styles.removeImageBtn}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Preço</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={styles.secondaryButton}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={saveMutation.isPending || isUploading}
                >
                  {saveMutation.isPending ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save size={18} /> Salvar
                    </>
                  )}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
