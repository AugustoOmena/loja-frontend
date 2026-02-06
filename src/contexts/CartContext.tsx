import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { OpcaoFrete } from "../types";

interface ProductInput {
  id?: number;
  name: string;
  price: number;
  images?: string[];
  size?: string | null;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string | null;
  /** Cor da variante (quando produto tem variants por cor + tamanho). Null para itens antigos ou sem cor. */
  color?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: ProductInput,
    size: string | null,
    maxQuantity?: number,
    color?: string | null,
  ) => void;
  removeFromCart: (id: number, size: string | null, color?: string | null) => void;
  updateQuantity: (id: number, size: string | null, delta: number, maxQuantity?: number, color?: string | null) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  /** Frete selecionado no checkout */
  selectedShipping: OpcaoFrete | null;
  setSelectedShipping: (op: OpcaoFrete | null) => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<OpcaoFrete | null>(
    null,
  );

  // --- Lazy Initialization (Carrega do localStorage direto no useState) ---
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("@loja-omena:cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Salva no LocalStorage sempre que 'items' mudar
  useEffect(() => {
    localStorage.setItem("@loja-omena:cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (
    product: ProductInput,
    size: string | null,
    maxQuantity?: number,
    color?: string | null,
  ) => {
    const colorNorm = color ?? null;
    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === product.id &&
          i.size === size &&
          (i.color ?? null) === colorNorm
      );

      if (existing) {
        const newQuantity = existing.quantity + 1;
        if (maxQuantity !== undefined && newQuantity > maxQuantity) return prev;
        return prev.map((i) =>
          i.id === product.id && i.size === size && (i.color ?? null) === colorNorm
            ? { ...i, quantity: newQuantity }
            : i,
        );
      }

      return [
        ...prev,
        {
          id: product.id!,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "",
          quantity: 1,
          size,
          color: colorNorm,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number, size: string | null, color?: string | null) => {
    const colorNorm = color ?? null;
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(i.id === id && i.size === size && (i.color ?? null) === colorNorm)
      ),
    );
  };

  const updateQuantity = (
    id: number,
    size: string | null,
    delta: number,
    maxQuantity?: number,
    color?: string | null,
  ) => {
    const colorNorm = color ?? null;
    setItems((prev) =>
      prev.map((i) => {
        if (
          i.id !== id ||
          i.size !== size ||
          (i.color ?? null) !== colorNorm
        )
          return i;
        const newQty = i.quantity + delta;
        if (newQty < 1) return i;
        if (maxQuantity !== undefined && newQty > maxQuantity) return i;
        return { ...i, quantity: newQty };
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
    setSelectedShipping(null);
  };

  const cartTotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        selectedShipping,
        setSelectedShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
