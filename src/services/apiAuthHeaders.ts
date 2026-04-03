import { supabase } from "@/services/supabaseClient";

/**
 * JWT do Supabase para a API HTTP (Lambda) validar o usuário.
 * `VITE_API_SEND_SUPABASE_JWT=false` desliga o header (útil se a API não validar JWT do Supabase).
 */
export async function getApiAuthHeaders(
  accessToken?: string | null
): Promise<Record<string, string>> {
  if (import.meta.env.VITE_API_SEND_SUPABASE_JWT === "false") {
    return {};
  }
  let token: string | undefined;
  if (typeof accessToken === "string" && accessToken.length > 0) {
    token = accessToken;
  } else {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
