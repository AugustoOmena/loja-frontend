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

    // Cria o observer
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      
      if (!entry) return;

      const isIntersecting = entry.isIntersecting;
      const currentEnabled = enabledRef.current;
      
      // Detecta se o elemento ACABOU DE ENTRAR na viewport (mudou de false para true)
      const justEnteredViewport = isIntersecting && !wasIntersectingRef.current;
      
      // Atualiza o estado anterior
      wasIntersectingRef.current = isIntersecting;
      
      // Só dispara se:
      // 1. Acabou de entrar na viewport (não estava visível antes)
      // 2. Não foi acionado recentemente
      // 3. Está habilitado
      const shouldTrigger = justEnteredViewport && !isTriggeredRef.current && currentEnabled;

      console.log('👁️ IntersectionObserver evento:', {
        isIntersecting,
        justEnteredViewport,
        intersectionRatio: entry.intersectionRatio,
        boundingClientRect: {
          top: entry.boundingClientRect.top,
          bottom: entry.boundingClientRect.bottom,
          height: entry.boundingClientRect.height,
          y: entry.boundingClientRect.y
        },
        isTriggered: isTriggeredRef.current,
        enabled: currentEnabled,
        shouldTrigger,
        scrollY: window.scrollY
      });

      // Se o elemento acabou de entrar na viewport...
      if (shouldTrigger) {
        console.log('✅ CHAMANDO callback loadMore... (elemento entrou na viewport)');
        isTriggeredRef.current = true;
        callbackRef.current();
        
        // Reset após um delay para permitir novo trigger
        setTimeout(() => {
          isTriggeredRef.current = false;
          wasIntersectingRef.current = false; // Reset também o estado de intersecção
          console.log('🔄 Reset do trigger, pronto para próxima carga');
        }, 2000);
      }
    }, { 
      threshold: 0, // Dispara assim que qualquer parte do elemento entrar na viewport
      rootMargin: '800px' // Aumentado para 800px - começa a carregar bem antes (melhor para filtros)
    });

    observerInstanceRef.current = observer;
    
    // Sempre observa o elemento (o callback verifica se enabled é true)
    observer.observe(el);
    
    // Verifica a posição inicial do elemento
    const rect = el.getBoundingClientRect();
    const initialTop = rect.top;
    const wasInitiallyVisible = initialTop < window.innerHeight + 500;
    
    // Guarda se estava visível inicialmente
    wasInitiallyVisibleRef.current = wasInitiallyVisible;
    lastScrollYRef.current = window.scrollY;
    
    console.log('🟢 IntersectionObserver criado e observando elemento...', {
      element: el,
      enabled: enabledRef.current,
      offsetTop: el.offsetTop,
      offsetHeight: el.offsetHeight,
      clientHeight: el.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
      windowHeight: window.innerHeight,
      rectTop: rect.top,
      wasInitiallyVisible,
      initialScrollY: lastScrollYRef.current
    });
    
    // NÃO dispara automaticamente se já estava visível
    // Só dispara quando o usuário rolar e o elemento entrar na viewport

    return true; // Observer criado com sucesso
  };

  // Effect para criar o observer quando o elemento estiver disponível
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Tenta criar imediatamente
    if (setupObserver()) {
      console.log('✅ Observer criado imediatamente');
      return;
    }

    console.log('⏳ Elemento não encontrado, tentando criar observer com intervalo...');

    // Se não conseguiu, tenta novamente com intervalos
    intervalId = setInterval(() => {
      if (setupObserver()) {
        console.log('✅ Observer criado com sucesso após tentativas');
        if (intervalId) clearInterval(intervalId);
      }
    }, 100); // Tenta a cada 100ms

    // Timeout de segurança após 5 segundos
    timeoutId = setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
      if (!observerInstanceRef.current) {
        console.error('❌ Não foi possível criar IntersectionObserver após 5 segundos');
      }
    }, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      console.log('🧹 Limpando IntersectionObserver');
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
        observerInstanceRef.current = null;
      }
      isTriggeredRef.current = false;
    };
  }, []); // Array vazio - só executa uma vez no mount

  // Effect adicional para recriar o observer quando enabled mudar (garantir que está ativo)
  useEffect(() => {
    // Se enabled mudou para true e o elemento existe, garante que o observer está criado
    if (enabled && observerRef.current && !observerInstanceRef.current) {
      console.log('🔄 Enabled mudou para true, criando observer...');
      setupObserver();
    }
  }, [enabled]);

  return observerRef;
}