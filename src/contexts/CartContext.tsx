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
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: ProductInput,
    size: string | null,
    maxQuantity?: number,
  ) => void;
  removeFromCart: (id: number, size: string | null) => void;
  updateQuantity: (id: number, size: string | null, delta: number, maxQuantity?: number) => void;
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
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size);

      if (existing) {
        // Se já existe, aumenta quantidade respeitando o limite
        const newQuantity = existing.quantity + 1;
        if (maxQuantity !== undefined && newQuantity > maxQuantity) {
          // Não adiciona se exceder o limite
          return prev;
        }
        return prev.map((i) =>
          i.id === product.id && i.size === size
            ? { ...i, quantity: newQuantity }
            : i,
        );
      }

      // Se não existe, adiciona novo item (sempre quantidade 1)
      return [
        ...prev,
        {
          id: product.id!,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "",
          quantity: 1,
          size,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number, size: string | null) => {
    setItems((prev) =>
      prev.filter((i) => !(i.id === id && i.size === size)),
    );
  };

  const updateQuantity = (
    id: number,
    size: string | null,
    delta: number,
    maxQuantity?: number,
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id || i.size !== size) return i;
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
