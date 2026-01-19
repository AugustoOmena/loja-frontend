import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react"; // Correção do import type

// Interface para o que vem do banco de dados (produto cru)
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
  addToCart: (product: ProductInput, size: string | null) => void; // Tipo corrigido
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("@loja-omena:cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("@loja-omena:cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (product: ProductInput, size: string | null) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size);

      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }

      return [
        ...prev,
        {
          id: product.id!, // Assumindo que id existe
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

  const removeFromCart = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : i;
        }
        return i;
      }),
    );
  };

  const clearCart = () => setItems([]);

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
