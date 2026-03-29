import { useState, useEffect, useRef } from "react";

const ROTATE_MS = 2500;
const FADE_MS = 280;

/**
 * Enquanto `loading` for true, cicla mensagens a cada ROTATE_MS com crossfade.
 * Retorna { displayIndex, opacity } para transição suave (fade out → troca texto → fade in).
 * Leve: um setInterval só quando loading; timeouts limpos ao desmontar.
 */
export function useProcessingMessage(
  loading: boolean,
  messageCount: number
): { displayIndex: number; opacity: number } {
  const [index, setIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const prevIndexRef = useRef(0);

  // Ciclo de mensagens
  useEffect(() => {
    if (!loading || messageCount <= 0) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messageCount);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [loading, messageCount]);

  // Crossfade: quando index muda, fade out → troca displayIndex → fade in
  useEffect(() => {
    if (!loading || messageCount <= 0) return;
    if (index === prevIndexRef.current) return;
    prevIndexRef.current = index;

    setOpacity(0);
    const t = setTimeout(() => {
      setDisplayIndex(index);
      setOpacity(1);
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [loading, messageCount, index]);

  // Reset ao sair do loading
  useEffect(() => {
    if (!loading) {
      prevIndexRef.current = 0;
      setDisplayIndex(0);
      setIndex(0);
      setOpacity(1);
    }
  }, [loading]);

  if (!loading) return { displayIndex: 0, opacity: 1 };
  return { displayIndex, opacity };
}
