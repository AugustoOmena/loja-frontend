import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export const authService = {
  // Login
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // CORREÇÃO: Método de Cadastro Adicionado aqui
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      // Opcional: Salvar nome nos metadados se tiver campo nome
      // options: { data: { name: 'Nome do Usuário' } } 
    });
    if (error) throw error;
    return data;
  },

  // Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback` 
      }
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }
};