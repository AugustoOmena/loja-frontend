export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  size: string | null;
  category: string;
  images: string[];
  quantity: number;
  stock?: Record<string, number>;
  created_at?: string;
}

// Resposta paginada da API
export interface PaginatedResponse<T> {
  data: T[];
  // Some APIs return `count`, others return `meta.total` — support both
  count?: number;
  page: number;
  limit: number;
  meta?: {
    total: number;
  };
}

// Filtros que enviaremos para a API
export interface ProductFilters {
  page: number;
  limit: number;
  name?: string;
  min_price?: string;
  max_price?: string;
  size?: string;
  sort?: string;
  category?: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  role: string | null;
  created_at?: string | null;
}

export interface UserFilters {
  page: number;
  limit: number;
  email?: string;
  role?: string;
  sort?: string;
}

export interface OrderItem {
  id: string;
  product_name: string; // O banco retorna isso
  name?: string;        // Opcional, para compatibilidade se precisar
  quantity: number;
  price: number;
}
