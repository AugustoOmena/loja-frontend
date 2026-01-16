import type { Product } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await fetch(`${API_URL}/produtos`);
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
  }
};