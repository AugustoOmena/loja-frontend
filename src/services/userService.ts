import type { UserProfile } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export const userService = {
  getAll: async (): Promise<UserProfile[]> => {
    const response = await fetch(`${API_URL}/usuarios`);
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