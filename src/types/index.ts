export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  size: string | null;
  quantity: number;
  created_at?: string;
}

// Resposta paginada da API
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
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
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface UserFilters {
  page: number;
  limit: number;
  email?: string;
  role?: string;
  sort?: string;
}