import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  getMelhorEnvioRedirectUri,
  melhorEnvioCallback,
} from "@/services/melhorEnvioIntegrationService";
import { useTheme } from "@/contexts/ThemeContext";

export const MelhorEnvioCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { colors } = useTheme();

  const code = params.get("code") || "";
  const state = params.get("state") || "";

  const redirectUri = useMemo(() => {
    try {
      return getMelhorEnvioRedirectUri();
    } catch {
      return "";
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!code || !state) {
        setError("Callback inválido: parâmetros 'code' e/ou 'state' ausentes.");
        setLoading(false);
        return;
      }
      if (!redirectUri) {
        setError("VITE_MELHORENVIO_REDIRECT_URI não configurada.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await melhorEnvioCallback({ code, state, redirect_uri: redirectUri });
        navigate("/backoffice/pedidos", { replace: true });
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Erro ao finalizar integração do Melhor Envio."
        );
        setLoading(false);
      }
    };

    run();
  }, [code, state, redirectUri, navigate]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: colors.text,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
          Melhor Envio
        </h1>

        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "14px",
              color: colors.muted,
              fontSize: "14px",
            }}
          >
            <Loader2 className="animate-spin" size={18} />
            Finalizando conexão...
          </div>
        ) : error ? (
          <div style={{ marginTop: "14px" }}>
            <p style={{ margin: 0, color: "#ef4444", fontSize: "14px" }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate("/backoffice/pedidos")}
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.text,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Voltar para Pedidos
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

