import type { UserProfile, UserFilters, PaginatedResponse } from '../types'; // Importe PaginatedResponse

const API_URL = import.meta.env.VITE_API_URL;

export const userService = {
  getAll: async (filters: UserFilters): Promise<PaginatedResponse<UserProfile>> => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    
    if (filters.email) params.append('email', filters.email);
    if (filters.role) params.append('role', filters.role);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await fetch(`${API_URL}/usuarios?${params.toString()}`);
    if (!response.ok) throw new Error('Erro ao buscar usuários');
    return response.json();
  },

  // Nota: Atualizar o perfil (ex: mudar role)
  update: async (user: UserProfile) => {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Erro ao atualizar usuário');
    return response.json();
  },

  // Nota: Deletar apenas o perfil (não deleta a conta do Auth se não tiver cascade)
  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error('Erro ao deletar usuário');
    return response.json();
  }
};