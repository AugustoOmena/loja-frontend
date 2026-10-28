import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { productService } from "../services/productService";
import { uploadService } from "../services/uploadService";
import { useDebounce } from "./useDebounce";
import type {
  Product,
  ProductFilters,
  ProductInput,
  ProductVariant,
} from "../types";

export const COLOR_MAP: Record<string, string> = {
  Todas: "#9CA3AF",
  AMARELO: "#EAB308",
  AZUL: "#2563EB",
  "AZUL MARINHO": "#1E3A8A",
  "AZUL MÉDIO": "#60A5FA",
  BEGE: "#D4C4A8",
  BRANCO: "#FFFFFF",
  BORDO: "#722F37",
  CEREJA: "#9F1239",
  CINZA: "#6B7280",
  CORAL: "#FF7F50",
  DOURADO: "#D97706",
  LARANJA: "#F97316",
  LILÁS: "#A78BFA",
  MANTEIGA: "#FEF3C7",
  MARROM: "#78350F",
  MOSTARDA: "#CA8A04",
  "OFF-WHITE": "#F8FAFC",
  PRETO: "#000000",
  ROSA: "#EC4899",
  "ROSA ESCURO": "#BE185D",
  ROXO: "#7C3AED",
  SALMÃO: "#FDA4AF",
  VERDE: "#22C55E",
  "VERDE MILITAR": "#4D5906",
  VERMELHO: "#DC2626",
};

export const LIGHT_COLORS = new Set(["OFF-WHITE", "MANTEIGA"]);
export const COLOR_OPTIONS = Object.keys(COLOR_MAP);

export const PATTERNS = [
  "Onça", "Oncinha", "Zebra", "Leopardo", "Animal Print",
  "Poá", "Listrado", "Xadrez", "Vichy", "Floral",
  "Folhagem", "Costela de Adão", "Coqueiros", "Tropical",
  "Fundo do Mar", "Frutas", "Caju", "Geométrico",
  "Abstrato", "Tie Dye", "Étnico", "Olho Grego",
  "Neon", "Degradê",
];

export const MATERIALS = [
  "Poliamida", "Poliéster", "Lycra", "Cirrê", "Suplex",
  "Fluity", "Lurex", "Canelado", "Atoalhado", "Jacquard",
  "Tule", "Linho", "Algodão", "Viscose", "Viscolinho",
  "Crochê", "Tricô", "Renda",
];

export const SIZES = [
  "PP", "P", "M", "G", "GG", "XGG",
  "36", "38", "40", "42", "44", "46", "48",
  "Único",
];

const initialFormState = {
  name: "",
  description: "",
  price: "",
  category: "",
  images: [] as string[],
  material: "",
  pattern: "",
};

export function useProducts() {
  const queryClient = useQueryClient();

  // Filtros
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

  // Query de Listagem
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => productService.getAll(filters),
    placeholderData: keepPreviousData,
  });

  const products = data?.data || [];
  const totalCount = data?.meta?.total || 0;
  const totalPages = Math.ceil(totalCount / pagination.limit);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
  const [isLoadingProductForEdit, setIsLoadingProductForEdit] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
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

      const initialVariants = product.variants?.length
        ? product.variants.map((v) => {
            const imgs = v.images && v.images.length ? v.images : (v.image ? [v.image] : []);
            return {
              ...v,
              image: imgs[0] || undefined,
              images: imgs,
            };
          })
        : [];
      setVariants(initialVariants);
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
          ? full.variants.map((v) => {
              const imgs = v.images && v.images.length ? v.images : (v.image ? [v.image] : []);
              return {
                color: v.color,
                size: v.size,
                stock_quantity: v.stock_quantity ?? 0,
                sku: v.sku,
                image: imgs[0] || undefined,
                images: imgs,
              };
            })
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

  // Upload de Imagens da Galeria Geral (1 ou N arquivos)
  const handleGalleryFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsUploading(true);

    try {
      const uploadedUrls = await Promise.all(
        files.map((file) => uploadService.uploadImage(file))
      );
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      alert("Erro ao fazer upload da imagem.");
      console.error(error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Upload de MÚLTIPLAS Imagens na VARIANTE (1 ou N arquivos concorrentes)
  const handleVariantFilesSelect = async (
    variantIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setUploadingVariantIndex(variantIndex);

    try {
      const uploadedUrls = await Promise.all(
        files.map((file) => uploadService.uploadImage(file))
      );

      setVariants((prev) =>
        prev.map((v, i) => {
          if (i !== variantIndex) return v;
          const currentImgs = v.images && v.images.length ? v.images : (v.image ? [v.image] : []);
          const updatedImgs = [...currentImgs, ...uploadedUrls];
          return {
            ...v,
            image: updatedImgs[0] || undefined,
            images: updatedImgs,
          };
        })
      );
    } catch (error) {
      alert("Erro ao fazer upload das imagens da variante.");
      console.error(error);
    } finally {
      setUploadingVariantIndex(null);
      e.target.value = "";
    }
  };

  // Remoção de UMA imagem específica da variante pelo índice
  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIndex) return v;
        const currentImgs = v.images && v.images.length ? v.images : (v.image ? [v.image] : []);
        const updatedImgs = currentImgs.filter((_, idx) => idx !== imageIndex);
        return {
          ...v,
          image: updatedImgs[0] || undefined,
          images: updatedImgs,
        };
      })
    );
  };

  const variantKey = (v: ProductVariant) =>
    `${(v.color ?? "").trim().toLowerCase()}|${(v.size ?? "").trim()}`;

  const hasDuplicateColorSize = (
    list: ProductVariant[],
    excludeIndex: number | null = null
  ): boolean => {
    const seen = new Set<string>();
    for (let i = 0; i < list.length; i++) {
      if (excludeIndex !== null && i === excludeIndex) continue;
      const key = variantKey(list[i]);
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  };

  const DUPLICATE_VARIANT_MSG =
    "Já existe uma variante com essa mesma cor e tamanho. Cadastre cada combinação apenas uma vez.";

  const addVariant = () => {
    const newVariant: ProductVariant = {
      color: COLOR_OPTIONS[0] ?? "",
      size: SIZES[0] ?? "",
      stock_quantity: 0,
      images: [],
    };
    if (hasDuplicateColorSize([...variants, newVariant])) {
      alert(DUPLICATE_VARIANT_MSG);
      return;
    }
    setVariants((prev) => [...prev, newVariant]);
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: string | number
  ) => {
    if (field !== "color" && field !== "size") {
      setVariants((prev) =>
        prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
      );
      return;
    }
    const next = variants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    if (hasDuplicateColorSize(next, index)) {
      alert(DUPLICATE_VARIANT_MSG);
      return;
    }
    setVariants(next);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const totalStock = variants.reduce(
    (s, v) => s + (Number(v.stock_quantity) || 0),
    0
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (variants.length === 0) {
      alert("Adicione ao menos uma variante (cor + tamanho + quantidade).");
      return;
    }
    if (hasDuplicateColorSize(variants)) {
      alert(DUPLICATE_VARIANT_MSG);
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
      variants: variants.map((v) => {
        const imgs = v.images && v.images.length ? v.images : (v.image ? [v.image] : []);
        return {
          color: v.color,
          size: v.size,
          stock_quantity: Number(v.stock_quantity) || 0,
          ...(v.sku ? { sku: v.sku } : {}),
          ...(imgs.length > 0 ? { image: imgs[0], images: imgs } : {}),
        };
      }),
    };

    saveMutation.mutate(payload);
  };

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

  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
const [isPreviewOpen, setIsPreviewOpen] = useState(false);

// Drag and drop nativo para a galeria geral
const handleDragStart = (index: number) => {
  setDraggedImageIndex(index);
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
};

const handleDrop = (targetIndex: number) => {
  if (draggedImageIndex === null || draggedImageIndex === targetIndex) return;
  setFormData((prev) => {
    const newImages = [...prev.images];
    const [movedItem] = newImages.splice(draggedImageIndex, 1);
    newImages.splice(targetIndex, 0, movedItem);
    return { ...prev, images: newImages };
  });
  setDraggedImageIndex(null);
};

// Define imediatamente qualquer foto como capa (posição 0)
const setAsCover = (index: number) => {
  if (index === 0) return;
  setFormData((prev) => {
    const newImages = [...prev.images];
    const [movedItem] = newImages.splice(index, 1);
    newImages.unshift(movedItem);
    return { ...prev, images: newImages };
  });
};

// Constrói o objeto Product formatado para o preview do cliente
const getPreviewData = (): Product => {
  return {
    id: currentProduct?.id || 999999,
    name: formData.name || "Pré-visualização do Produto",
    description: formData.description || "",
    price: parseFloat(formData.price) || 0,
    category: formData.category || "",
    material: formData.material || "",
    pattern: formData.pattern || "",
    images: formData.images,
    size: null,
    variants: variants.map((v) => ({
      color: v.color,
      size: v.size,
      stock_quantity: Number(v.stock_quantity) || 0,
      image: v.image,
      images: v.images,
    })),
  };
};

return {
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
    draggedImageIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    setAsCover,
    isPreviewOpen,
    setIsPreviewOpen,
    getPreviewData,
  };
}