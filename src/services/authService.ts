// IMPORTANTE: Importamos a instância única, não criamos uma nova!
import { supabase } from './supabaseClient'; 

export const authService = {
  // Login com Email/Senha
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    if (error) throw error;
    return data;
  },
  
  // Cadastro
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
    });
    if (error) throw error;
    return data;
  },

  // Login com Google
  signInWithGoogle: async () => {
    // Pega a URL atual do site dinamicamente (seja localhost ou produção)
    const redirectTo = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo, 
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Opcional: Limpar local storage se tiver dados sensíveis manuais
    localStorage.removeItem('@loja-omena:cart'); // Se quiser limpar o carrinho ao sair
  },

  // Pegar usuário atual (vai no servidor validar)
  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  // Pegar sessão (verifica cookie local - mais rápido)
  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  
  // Expõe a instância supabase para casos de uso direto em componentes
  supabase 
};