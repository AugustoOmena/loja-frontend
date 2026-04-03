import { supabase } from "@/services/supabaseClient";

/**
 * JWT do Supabase para a API HTTP (Lambda) validar o usuário e a role.
 * Sem isso, rotas como GET /pedidos?user_id= são tratadas como "listar tudo" e retornam 403.
 */
export async function getApiAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
