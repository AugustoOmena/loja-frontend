import { useEffect, useRef } from 'react';

export function useIntersectionObserver(
  callback: () => void,
  enabled: boolean = true
) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver((entries) => {
      // Se o elemento ficou visível na tela...
      if (entries[0].isIntersecting) {
        callback(); // Chama a função de carregar mais
      }
    }, { threshold: 0.5 }); // 50% visível

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [callback, enabled]);

  return observerRef;
}