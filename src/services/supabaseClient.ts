import { createClient } from '@supabase/supabase-js';

// Carrega as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltam variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_KEY");
}

// Cria a instância ÚNICA e exporta
export const supabase = createClient(supabaseUrl, supabaseKey);