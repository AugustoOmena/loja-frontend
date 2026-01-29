import { useEffect, useRef } from 'react';

export function useIntersectionObserver(
  callback: () => void,
  enabled: boolean = true,
  recheckWhen?: unknown
) {
  const observerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  const isTriggeredRef = useRef(false);
  const observerInstanceRef = useRef<IntersectionObserver | null>(null);
  const enabledRef = useRef(enabled);
  const lastScrollYRef = useRef(0);
  const wasInitiallyVisibleRef = useRef(false);
  const wasIntersectingRef = useRef(false);
  const prevRecheckWhenRef = useRef<boolean | undefined>(undefined);

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
        if (import.meta.env.DEV) {
          console.log("[scroll-inf] IntersectionObserver: sentinela entrou na viewport, disparando callback");
        }
        callbackRef.current();

        // Reset após delay curto para permitir novo trigger ao rolar de novo
        setTimeout(() => {
          isTriggeredRef.current = false;
          wasIntersectingRef.current = false;
        }, 400);
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
    
    // Verifica se o elemento já está visível após o DOM pintar (re-setup após load more).
    // IntersectionObserver não dispara para elementos já visíveis ao criar o observer.
    const runVisibilityCheck = () => {
      if (!observerRef.current || !enabledRef.current || isTriggeredRef.current) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const rootMargin = 200;
      const isVisible = rect.top < windowHeight + rootMargin && rect.bottom > -rootMargin;
      if (isVisible) {
        isTriggeredRef.current = true;
        callbackRef.current();
        setTimeout(() => {
          isTriggeredRef.current = false;
          wasIntersectingRef.current = true;
        }, 400);
      }
    };
    setTimeout(runVisibilityCheck, 150);
    setTimeout(runVisibilityCheck, 400);
    
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

  // Re-setup apenas quando o carregamento TERMINAR (recheckWhen: true → false).
  // Assim não desconectamos o observer quando o usuário dispara (false → true),
  // evitando que o scroll infinito pare após a primeira carga na StoreHome.
  // Sempre array literal como deps para evitar "Cannot read properties of undefined (reading 'length')".
  useEffect(() => {
    const wasLoading = prevRecheckWhenRef.current === true;
    const nowLoading = recheckWhen === true;
    prevRecheckWhenRef.current = recheckWhen === true;

    if (observerRef.current && wasLoading && !nowLoading) {
      if (import.meta.env.DEV) {
        console.log("[scroll-inf] Re-setup do observer (carregamento terminou)");
      }
      setupObserver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recheckWhen pode ser undefined; array sempre definido
  }, recheckWhen === undefined ? [] : [recheckWhen]);

  return observerRef;
}