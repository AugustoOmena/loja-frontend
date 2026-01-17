import { useState, useEffect } from "react";
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
} from "lucide-react";
import { productService } from "../../services/productService";
import type { Product, ProductFilters } from "../../types";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

export const Products = () => {
  const queryClient = useQueryClient(); // Para invalidar cache

  // 1. Estados de Filtro e Debounce (Mantidos igual)
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 10,
    name: "",
    min_price: "",
    max_price: "",
    size: "",
    sort: "newest",
  });

  const [localName, setLocalName] = useState("");
  const [localMinPrice, setLocalMinPrice] = useState("");
  const [localMaxPrice, setLocalMaxPrice] = useState("");

  const debouncedName = useDebounce(localName, 500);
  const debouncedMinPrice = useDebounce(localMinPrice, 500);
  const debouncedMaxPrice = useDebounce(localMaxPrice, 500);

  // Sincronização dos Debounces
  useEffect(() => {
    setFilters((p) => ({ ...p, name: debouncedName, page: 1 }));
  }, [debouncedName]);
  useEffect(() => {
    setFilters((p) => ({ ...p, min_price: debouncedMinPrice, page: 1 }));
  }, [debouncedMinPrice]);
  useEffect(() => {
    setFilters((p) => ({ ...p, max_price: debouncedMaxPrice, page: 1 }));
  }, [debouncedMaxPrice]);

  // --- 2. REACT QUERY: BUSCA DE DADOS ---
  // A query roda automaticamente sempre que 'filters' mudar
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => productService.getAll(filters),
    placeholderData: keepPreviousData,
  });

  // Facilitadores
  const products = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / filters.limit);

  // --- 3. REACT QUERY: MUTAÇÕES (Salvar/Deletar) ---

  // Mutação de Salvar (Criar ou Editar)
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (currentProduct?.id)
        return productService.update({ ...payload, id: currentProduct.id });
      return productService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Força atualização da lista
      setIsModalOpen(false);
    },
    onError: () => alert("Erro ao salvar produto"),
  });

  // Mutação de Deletar
  const deleteMutation = useMutation({
    mutationFn: productService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    onError: () => alert("Erro ao excluir"),
  });

  // --- RESTO DO CÓDIGO (Modal e UI) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    size: "",
    quantity: "0",
  });

  const handleExportExcel = async () => {
    // Mantive a lógica original pois é uma ação pontual sob demanda
    // Se quisesse cachear isso, poderia, mas geralmente exportação quer dados "agora"
    try {
      const allProducts = await productService.getAllForExport();
      const headers = [
        "ID",
        "Nome",
        "Descrição",
        "Preço",
        "Estoque",
        "Tamanho",
      ];
      const csvRows = allProducts.map((p) => {
        const cleanName = `"${(p.name || "").replace(/"/g, '""')}"`;
        const cleanDesc = `"${(p.description || "").replace(/"/g, '""')}"`;
        const formattedPrice = p.price.toFixed(2).replace(".", ",");
        return [
          p.id,
          cleanName,
          cleanDesc,
          formattedPrice,
          p.quantity || 0,
          p.size || "",
        ].join(";");
      });
      const csvString = [headers.join(";"), ...csvRows].join("\n");
      const blob = new Blob(["\uFEFF" + csvString], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `estoque_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Erro ao gerar planilha");
    }
  };

  const handleSelectChange = (key: keyof ProductFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        size: product.size || "",
        quantity: (product.quantity || 0).toString(),
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        size: "",
        quantity: "0",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      size: formData.size || null,
      quantity: parseInt(formData.quantity) || 0,
    };
    saveMutation.mutate(payload); // Dispara a mutação
  };

  const handleDelete = (id: number) => {
    if (confirm("Excluir este produto?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isError)
    return <div style={styles.container}>Erro ao carregar dados.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Produtos ({totalCount})</h1>
        {/* Indicador visual de carregamento em background (opcional) */}
        {/* {isFetching && <span style={{fontSize: '12px', color: '#64748b'}}>Atualizando...</span>} */}
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

      <div style={styles.filterContainer}>
        <div style={styles.filterRow}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={{ color: "var(--muted)" }} />
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
            <span style={{ color: "var(--muted)" }}>-</span>
            <input
              placeholder="Max"
              type="number"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              style={styles.filterInput}
            />
          </div>
          <select
            value={filters.size || ""}
            onChange={(e) => handleSelectChange("size", e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Todos</option>
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
              style={{
                position: "absolute",
                left: "10px",
                pointerEvents: "none",
                color: "var(--muted)",
              }}
            />
            <select
              value={filters.sort || "newest"}
              onChange={(e) => handleSelectChange("sort", e.target.value)}
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

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeadRow}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Produto</th>
              <th style={styles.th}>Preço</th>
              <th style={styles.th}>Qtd.</th>
              <th style={styles.th}>Tam.</th>
              <th style={styles.thAction}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={styles.tdCenter}>
                  Carregando...
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} style={styles.tableRow}>
                  <td style={styles.td}>#{product.id}</td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: "bold" }}>{product.name}</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        maxWidth: "300px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {product.description}
                    </div>
                  </td>
                  <td style={styles.td}>R$ {product.price.toFixed(2)}</td>
                  <td style={styles.td}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color:
                          (product.quantity || 0) < 5
                            ? "#ef4444"
                            : "var(--text)",
                      }}
                    >
                      <Package size={16} /> {product.quantity || 0}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {product.size && (
                      <span style={styles.badge}>{product.size}</span>
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

      <div style={styles.pagination}>
        <span style={{ color: "var(--muted)", fontSize: "14px" }}>
          Pág <b>{filters.page}</b> de <b>{totalPages || 1}</b>
        </span>
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            style={
              filters.page === 1 ? styles.pageButtonDisabled : styles.pageButton
            }
          >
            <ChevronLeft size={20} />
          </button>
          <button
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            style={
              filters.page >= totalPages
                ? styles.pageButtonDisabled
                : styles.pageButton
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

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
            <form onSubmit={handleSave} style={styles.form}>
              {/* Inputs mantidos iguais */}
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
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
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
                <div style={{ ...styles.formGroup, width: "100px" }}>
                  <label style={styles.label}>Qtd.</label>
                  <input
                    required
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.formGroup, width: "100px" }}>
                  <label style={styles.label}>Tam.</label>
                  <select
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="">-</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                  </select>
                </div>
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
                  disabled={saveMutation.isPending}
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
          </div>
        </div>
      )}
    </div>
  );
};

// ... Estilos mantidos iguais ...
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  title: { fontSize: "24px", fontWeight: "bold", color: "var(--text)" },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  secondaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--bg-elevated)",
    color: "var(--muted)",
    border: "1px solid #cbd5e1",
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
    color: "var(--muted)",
  },
  filterContainer: {
    marginBottom: "20px",
    backgroundColor: "var(--bg-elevated)",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  filterRow: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "var(--input-bg)",
    padding: "10px 15px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    flex: 2,
    minWidth: "200px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    background: "transparent",
    fontSize: "14px",
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
    border: "1px solid #e2e8f0",
    width: "100%",
    fontSize: "14px",
  },
  filterSelect: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    minWidth: "120px",
    fontSize: "14px",
  },
  tableContainer: {
    backgroundColor: "var(--bg-elevated)",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeadRow: {
    backgroundColor: "var(--bg-elevated)",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    padding: "15px",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--muted)",
  },
  thAction: {
    padding: "15px",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--muted)",
    textAlign: "right",
  },
  tableRow: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "15px", fontSize: "15px", color: "var(--text)" },
  tdCenter: { padding: "30px", textAlign: "center", color: "var(--muted)" },
  tdAction: {
    padding: "15px",
    textAlign: "right",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  badge: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
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
    border: "1px solid #cbd5e1",
    backgroundColor: "var(--bg-elevated)",
    borderRadius: "6px",
    cursor: "pointer",
    color: "var(--text)",
  },
  pageButtonDisabled: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    border: "1px solid #e2e8f0",
    backgroundColor: "var(--bg)",
    borderRadius: "6px",
    cursor: "not-allowed",
    color: "#cbd5e1",
  },
  modalOverlay: {
    position: "fixed",
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
    backgroundColor: "var(--bg-elevated)",
    padding: "30px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
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
    color: "var(--text)",
    margin: 0,
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "500", color: "var(--text)" },
  input: {
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "15px",
    outline: "none",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px",
  },
};
