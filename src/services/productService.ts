import type { Product, PaginatedResponse, ProductFilters } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export const productService = {
  getAll: async (filters: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.name) params.append('name', filters.name);
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    if (filters.size) params.append('size', filters.size);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await fetch(`${API_URL}/produtos?${params.toString()}`);
    if (!response.ok) throw new Error('Erro ao buscar produtos');
    return response.json();
  },
  create: async (product: Omit<Product, 'id'>) => {
    const response = await fetch(`${API_URL}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Erro ao criar produto');
    return response.json();
  },

  update: async (product: Product) => {
    const response = await fetch(`${API_URL}/produtos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Erro ao atualizar produto');
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_URL}/produtos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error('Erro ao deletar produto');
    return response.json();
  },

  getAllForExport: async (): Promise<Product[]> => {
    // Pedimos um limite alto (ex: 1000) para trazer tudo de uma vez
    const response = await fetch(`${API_URL}/produtos?limit=1000&page=1`);
    if (!response.ok) throw new Error('Erro ao baixar dados para exportação');
    const json = await response.json();
    return json.data; // Retorna apenas a lista pura
  }
};