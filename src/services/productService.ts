import type { Product, ProductInput, PaginatedResponse, ProductFilters } from '../types';

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
  create: async (product: ProductInput) => {
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
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Erro ao deletar produto');
    
    if (response.status === 204) return null;

    return response.json();
  },

  getAllForExport: async (): Promise<Product[]> => {
    // Pedimos um limite alto (ex: 1000) para trazer tudo de uma vez
    const response = await fetch(`${API_URL}/produtos?limit=1000&page=1`);
    if (!response.ok) throw new Error('Erro ao baixar dados para exportação');
    const json = await response.json();
    return json.data; // Retorna apenas a lista pura
  },
  getInfinite: async ({ pageParam = 1, filters }: { pageParam: number, filters: any }) => {
    const params = new URLSearchParams();
    params.append('page', pageParam.toString());
    params.append('limit', '10');
    
    if (filters.search) params.append('name', filters.search);
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    if (filters.sort) params.append('sort', filters.sort);
    
    // --- CORREÇÃO: ADICIONANDO CATEGORIA ---
    if (filters.category) params.append('category', filters.category);

    const response = await fetch(`${API_URL}/produtos?${params.toString()}`);
    if (!response.ok) throw new Error('Erro ao buscar produtos');
    return response.json();
  },
  getById: async (id: number): Promise<Product> => {
    // Erro comum: esquecer de colocar /${id} no final
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar produto");
    }

    return response.json();
  },
};