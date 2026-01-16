import { useState, useEffect } from 'react';

// Este hook recebe um valor e um atraso (delay)
// Ele só atualiza o valor de retorno depois que o delay passar sem novas mudanças
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configura o timer para atualizar o valor
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Se o valor mudar antes do tempo (usuário digitou mais uma letra),
    // o React limpa o timer anterior e começa um novo.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}