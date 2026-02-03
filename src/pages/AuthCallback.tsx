import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { Loader2 } from "lucide-react";

const MAX_WAIT_MS = 6000;
const RETRY_INTERVAL_MS = 300;

/**
 * Página de callback do OAuth (Google, etc.).
 * No mobile o hash (#access_token=...) pode demorar a estar disponível;
 * aguardamos a sessão com retries antes de redirecionar.
 */
export const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tryGetSession = (elapsed: number): void => {
      if (cancelled) return;

      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        if (data.session?.user) {
          navigate("/", { replace: true });
          return;
        }
        if (elapsed >= MAX_WAIT_MS) {
          setError("Login expirado ou indisponível.");
          timeoutId = setTimeout(() => navigate("/login", { replace: true }), 1500);
          return;
        }
        timeoutId = setTimeout(
          () => tryGetSession(elapsed + RETRY_INTERVAL_MS),
          RETRY_INTERVAL_MS
        );
      });
    };

    // Pequeno delay inicial: no mobile o hash às vezes ainda não está no location
    timeoutId = setTimeout(() => tryGetSession(0), 150);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        padding: 20,
        fontFamily: "sans-serif",
      }}
    >
      {error ? (
        <p style={{ color: "#dc2626", textAlign: "center", marginTop: 12 }}>
          {error}
        </p>
      ) : (
        <>
          <Loader2
            className="animate-spin"
            size={48}
            color="#10b981"
            style={{ marginBottom: 16 }}
          />
          <p style={{ color: "#64748b", fontSize: 15 }}>Entrando...</p>
        </>
      )}
    </div>
  );
};
