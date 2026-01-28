import { useEffect, useRef } from 'react';

export function useIntersectionObserver(
  callback: () => void,
  enabled: boolean = true
) {
  const observerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  const isTriggeredRef = useRef(false);
  const observerInstanceRef = useRef<IntersectionObserver | null>(null);
  const enabledRef = useRef(enabled);
  const lastScrollYRef = useRef(0);
  const wasInitiallyVisibleRef = useRef(false);
  const wasIntersectingRef = useRef(false);

  // Atualiza as referências sempre que mudarem
  useEffect(() => {
    callbackRef.current = callback;
    enabledRef.current = enabled;
  }, [callback, enabled]);

  // Função para criar o observer quando o elemento estiver disponível
  const setupObserver = () => {
    const el = observerRef.current;
    if (!el) {
      return false; // Elemento ainda não está disponível
    }

    // Limpa observer anterior se existir
    if (observerInstanceRef.current) {
      observerInstanceRef.current.disconnect();
      observerInstanceRef.current = null;
    }

    // Reset do estado de trigger quando recriar o observer
    isTriggeredRef.current = false;
    wasIntersectingRef.current = false;

    // Cria o observer
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      
      if (!entry) return;

      const isIntersecting = entry.isIntersecting;
      const currentEnabled = enabledRef.current;
      
      // Se não está habilitado, não faz nada
      if (!currentEnabled) {
        return;
      }

      // Se já foi acionado recentemente, não dispara novamente
      if (isTriggeredRef.current) {
        return;
      }

      // Se está visível (intersectando), dispara o callback
      if (isIntersecting) {
        isTriggeredRef.current = true;
        callbackRef.current();
        
        // Reset após um delay para permitir novo trigger
        setTimeout(() => {
          isTriggeredRef.current = false;
          wasIntersectingRef.current = false;
        }, 1000);
      }
      
      // Atualiza o estado anterior
      wasIntersectingRef.current = isIntersecting;
    }, { 
      threshold: 0, // Dispara assim que qualquer parte do elemento entrar na viewport
      rootMargin: '200px' // Carrega quando está a 200px de entrar na viewport
    });

    observerInstanceRef.current = observer;
    
    // Sempre observa o elemento (o callback verifica se enabled é true)
    observer.observe(el);
    
    // Verifica imediatamente se o elemento já está visível usando takeRecords
    // Isso é necessário porque o IntersectionObserver não dispara eventos
    // para elementos que já estão visíveis quando o observer é criado
    setTimeout(() => {
      const records = observer.takeRecords();
      if (records.length > 0) {
        const entry = records[0];
        if (entry && entry.isIntersecting && enabledRef.current && !isTriggeredRef.current) {
          isTriggeredRef.current = true;
          callbackRef.current();
          
          setTimeout(() => {
            isTriggeredRef.current = false;
            wasIntersectingRef.current = true;
          }, 1000);
        }
      } else {
        // Se não há records, verifica manualmente a posição
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const rootMargin = 200;
        const isVisible = rect.top < windowHeight + rootMargin && rect.bottom > -rootMargin;
        
        if (isVisible && enabledRef.current && !isTriggeredRef.current) {
          isTriggeredRef.current = true;
          callbackRef.current();
          
          setTimeout(() => {
            isTriggeredRef.current = false;
            wasIntersectingRef.current = true;
          }, 1000);
        }
      }
    }, 100);
    
    // Verifica a posição inicial do elemento
    const rect = el.getBoundingClientRect();
    const initialTop = rect.top;
    const windowHeight = window.innerHeight;
    const rootMargin = 200;
    const wasInitiallyVisible = initialTop < windowHeight + rootMargin;
    
    // Guarda se estava visível inicialmente
    wasInitiallyVisibleRef.current = wasInitiallyVisible;
    lastScrollYRef.current = window.scrollY;

    return true; // Observer criado com sucesso
  };

  // Effect para criar o observer quando o elemento estiver disponível
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Tenta criar imediatamente
    if (setupObserver()) {
      return;
    }

    // Se não conseguiu, tenta novamente com intervalos
    intervalId = setInterval(() => {
      if (setupObserver()) {
        if (intervalId) clearInterval(intervalId);
      }
    }, 100);

    // Timeout de segurança após 5 segundos
    timeoutId = setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
    }, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
        observerInstanceRef.current = null;
      }
      isTriggeredRef.current = false;
    };
  }, []); // Array vazio - só executa uma vez no mount

  // Effect adicional para recriar o observer quando enabled mudar (garantir que está ativo)
  useEffect(() => {
    if (observerRef.current) {
      setupObserver();
    }
  }, [enabled]);

  return observerRef;
}