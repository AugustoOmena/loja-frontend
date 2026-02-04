/** Resposta da API ViaCEP */
export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Busca endereço por CEP via ViaCEP.
 * @returns Dados preenchidos ou null se CEP inválido/erro
 */
export async function buscarCep(
  cep: string,
): Promise<Omit<ViaCepResponse, "erro"> | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(
      `https://viacep.com.br/ws/${digits}/json/`,
    );
    const data = (await res.json()) as ViaCepResponse;
    if (data.erro || !data.cep) return null;
    return data;
  } catch {
    return null;
  }
}
