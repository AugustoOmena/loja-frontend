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
  Camera,
  Eye,
  Star,
} from "lucide-react";
import { ProductDetails } from "../../../store/pages/product-details/ProductDetails";
import { useTheme } from "../../../contexts/ThemeContext";
import { getProductQuantity } from "../../../utils/productHelpers";
import {
  useProducts,
  COLOR_MAP,
  LIGHT_COLORS,
  COLOR_OPTIONS,
  PATTERNS,
  MATERIALS,
  SIZES,
} from "../../../hooks/useProducts";
import { createProductsStyles } from "./Products.styles";
import type { Product } from "../../../types";

export const Products = () => {
  const { colors, theme } = useTheme();
  const styles = createProductsStyles(colors, theme);

  const {
    pagination,
    setPagination,
    sort,
    setSort,
    sizeFilter,
    setSizeFilter,
    localName,
    setLocalName,
    localMinPrice,
    setLocalMinPrice,
    localMaxPrice,
    setLocalMaxPrice,
    products,
    totalCount,
    totalPages,
    isLoading,
    isError,
    isModalOpen,
    setIsModalOpen,
    currentProduct,
    isUploading,
    uploadingVariantIndex,
    isLoadingProductForEdit,
    variants,
    formData,
    setFormData,
    totalStock,
    handleOpenModal,
    handleGalleryFilesSelect,
    handleRemoveGalleryImage,
    handleVariantFilesSelect,
    handleRemoveVariantImage,
    addVariant,
    updateVariant,
    removeVariant,
    handleSave,
    handleDelete,
    handleExportExcel,
    saveMutation,
    handleDragStart,
    handleDragOver,
    handleDrop,
    setAsCover,
    isPreviewOpen,
    setIsPreviewOpen,
    getPreviewData,
  } = useProducts();

  if (isError)
    return (
      <div style={{ padding: "20px", color: colors.text }}>
        Erro ao carregar dados.
      </div>
    );

  return (
    <div style={styles.container}>
      {/* Cabeçalho */}
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

      {/* Tabela de Produtos */}
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
              products.map((product: Product) => (
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
                        color:
                          getProductQuantity(product) < 5
                            ? "#ef4444"
                            : colors.text,
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
                      title="Editar produto"
                    >
                      <Edit size={18} color="#0284c7" />
                    </button>
                    <button
                      onClick={() =>
                        product.id != null && handleDelete(product.id)
                      }
                      style={styles.iconButton}
                      title="Excluir produto"
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

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {currentProduct ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={styles.closeButton}
              >
                <X size={24} />
              </button>
            </div>

            {isLoadingProductForEdit ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px",
                  gap: "12px",
                  color: colors.muted,
                }}
              >
                <Loader2 size={24} className="animate-spin" />
                <span>Carregando dados do produto...</span>
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
                    rows={4}
                    placeholder="Quebras de linha serão mantidas na exibição."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    style={{
                      ...styles.input,
                      resize: "vertical",
                      whiteSpace: "pre-wrap",
                    }}
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

                {/* Variantes com Suporte a Múltiplas Fotos */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Estoque e Variantes</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: colors.muted }}>
                      Total: <b style={{ color: colors.text }}>{totalStock}</b>{" "}
                      unidades
                    </span>
                    <button
                      type="button"
                      onClick={addVariant}
                      style={{
                        ...styles.secondaryButton,
                        padding: "6px 12px",
                        fontSize: "13px",
                      }}
                    >
                      <Plus size={14} /> Adicionar variante
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <div
                      style={{
                        padding: "12px",
                        border: `1px dashed ${colors.border}`,
                        borderRadius: "6px",
                        color: colors.muted,
                        fontSize: "14px",
                      }}
                    >
                      Nenhuma variante cadastrada. Clique em &quot;Adicionar
                      variante&quot;.
                    </div>
                  ) : (
                    <div
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: "6px",
                        overflowX: "auto",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "13px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor:
                                theme === "dark" ? "#1e293b" : "#f8fafc",
                              borderBottom: `1px solid ${colors.border}`,
                            }}
                          >
                            <th style={{ ...styles.th, padding: "8px 10px" }}>
                              Cor
                            </th>
                            <th style={{ ...styles.th, padding: "8px 10px" }}>
                              Tamanho
                            </th>
                            <th style={{ ...styles.th, padding: "8px 10px" }}>
                              Qtde
                            </th>
                            <th style={{ ...styles.th, padding: "8px 10px" }}>
                              Fotos da Variante (uma ou mais)
                            </th>
                            <th
                              style={{
                                ...styles.th,
                                padding: "8px 10px",
                                width: "40px",
                              }}
                            ></th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((v, idx) => {
                            const variantImgs =
                              v.images && v.images.length
                                ? v.images
                                : v.image
                                  ? [v.image]
                                  : [];
                            return (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: `1px solid ${colors.border}`,
                                }}
                              >
                                {/* Cor */}
                                <td style={{ padding: "8px 10px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    {v.color && COLOR_MAP[v.color] && (
                                      <span
                                        style={{
                                          width: "16px",
                                          height: "16px",
                                          borderRadius: "50%",
                                          backgroundColor: COLOR_MAP[v.color],
                                          border: LIGHT_COLORS.has(v.color)
                                            ? `1px solid ${colors.border}`
                                            : "none",
                                          flexShrink: 0,
                                        }}
                                      />
                                    )}
                                    <select
                                      value={v.color}
                                      onChange={(e) =>
                                        updateVariant(
                                          idx,
                                          "color",
                                          e.target.value,
                                        )
                                      }
                                      style={{
                                        ...styles.input,
                                        padding: "6px 8px",
                                        minWidth: "120px",
                                      }}
                                    >
                                      {COLOR_OPTIONS.map((name) => (
                                        <option key={name} value={name}>
                                          {name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </td>

                                {/* Tamanho */}
                                <td style={{ padding: "8px 10px" }}>
                                  <select
                                    value={v.size}
                                    onChange={(e) =>
                                      updateVariant(idx, "size", e.target.value)
                                    }
                                    style={{
                                      ...styles.input,
                                      padding: "6px 8px",
                                      minWidth: "75px",
                                    }}
                                  >
                                    {SIZES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Quantidade */}
                                <td style={{ padding: "8px 10px" }}>
                                  <input
                                    type="number"
                                    min={0}
                                    value={
                                      v.stock_quantity === 0
                                        ? ""
                                        : v.stock_quantity
                                    }
                                    onChange={(e) =>
                                      updateVariant(
                                        idx,
                                        "stock_quantity",
                                        Number(e.target.value) || 0,
                                      )
                                    }
                                    style={{
                                      ...styles.input,
                                      padding: "6px 8px",
                                      width: "65px",
                                    }}
                                  />
                                </td>

                                {/* Miniaturas + Botão Adicionar Fotos */}
                                <td style={{ padding: "8px 10px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      flexWrap: "wrap",
                                      minWidth: "140px",
                                    }}
                                  >
                                    {variantImgs.map((imgUrl, imgIdx) => (
                                      <div
                                        key={imgIdx}
                                        style={styles.variantImageThumbnail}
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Variante ${v.color} - ${imgIdx + 1}`}
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
                                          onClick={() =>
                                            handleRemoveVariantImage(
                                              idx,
                                              imgIdx,
                                            )
                                          }
                                          style={styles.variantImageRemoveBtn}
                                          title="Remover esta foto"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}

                                    {/* Botão de upload SEMPRE presente */}
                                    <div>
                                      <input
                                        type="file"
                                        id={`variant-upload-${idx}`}
                                        accept="image/*"
                                        multiple
                                        onChange={(e) =>
                                          handleVariantFilesSelect(idx, e)
                                        }
                                        style={{ display: "none" }}
                                        disabled={uploadingVariantIndex === idx}
                                      />
                                      <label
                                        htmlFor={`variant-upload-${idx}`}
                                        style={styles.variantAddImageBtn}
                                        title="Adicionar fotos (selecione uma ou várias)"
                                      >
                                        {uploadingVariantIndex === idx ? (
                                          <Loader2
                                            size={12}
                                            className="animate-spin"
                                          />
                                        ) : (
                                          <Camera size={12} />
                                        )}
                                        <span>+ Foto</span>
                                      </label>
                                    </div>
                                  </div>
                                </td>

                                {/* Excluir Linha */}
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Galeria Geral do Produto (Suporte a múltiplos arquivos simultâneos) */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Galeria Geral do Produto (Arraste para reordenar ou clique
                    na estrela para definir a Capa)
                  </label>
                  <div style={{ marginBottom: "10px" }}>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryFilesSelect}
                      style={{ display: "none" }}
                      disabled={isUploading}
                    />
                    <label htmlFor="image-upload" style={styles.uploadButton}>
                      {isUploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                      {isUploading
                        ? "Enviando..."
                        : "Adicionar Fotos à Galeria"}
                    </label>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {formData.images.map((img, idx) => {
                      const isCover = idx === 0;
                      return (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(idx)}
                          style={{
                            position: "relative",
                            width: "80px",
                            height: "80px",
                            borderRadius: "6px",
                            border: isCover
                              ? "2px solid #6366f1"
                              : `1px solid ${colors.border}`,
                            boxShadow: isCover
                              ? "0 0 8px rgba(99, 102, 241, 0.4)"
                              : "none",
                            cursor: "grab",
                            overflow: "hidden",
                            backgroundColor: colors.card,
                          }}
                          title={
                            isCover ? "Foto de Capa" : "Arraste para reordenar"
                          }
                        >
                          <img
                            src={img}
                            alt="Produto"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />

                          {/* Selo / Botão de Capa */}
                          {isCover ? (
                            <span
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: "#6366f1",
                                color: "white",
                                fontSize: "9px",
                                fontWeight: "bold",
                                textAlign: "center",
                                padding: "2px 0",
                              }}
                            >
                              CAPA
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAsCover(idx)}
                              style={{
                                position: "absolute",
                                top: "4px",
                                left: "4px",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                border: "none",
                                borderRadius: "4px",
                                padding: "3px",
                                color: "#e2e8f0",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                              title="Definir como foto de capa"
                            >
                              <Star size={12} />
                            </button>
                          )}

                          {/* Botão de Remover */}
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              background: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "18px",
                              height: "18px",
                              fontSize: "10px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Remover foto"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preço */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Preço (R$)</label>
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

                {/* Footer com botões de ação */}
                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    style={{
                      ...styles.secondaryButton,
                      backgroundColor: "#6366f1",
                      color: "white",
                      border: "none",
                    }}
                  >
                    <Eye size={18} /> Visualizar Anúncio
                  </button>
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
                    disabled={
                      saveMutation.isPending ||
                      isUploading ||
                      uploadingVariantIndex !== null
                    }
                  >
                    <Save size={18} /> Salvar Produto
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Modal Fullscreen de Prévia reaproveitando ProductDetails */}
      {isPreviewOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: colors.bg,
            overflowY: "auto",
          }}
        >
          <ProductDetails
            previewProduct={getPreviewData()}
            onClosePreview={() => setIsPreviewOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
