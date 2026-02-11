import { AlertCircle, X } from "lucide-react";
import { messages } from "../constants/messages";

export interface CheckoutErrorBannerProps {
  /** Título do bloco (ex.: "Erro no pagamento") */
  title?: string;
  /** Mensagem principal */
  message: string;
  /** Detalhes adicionais (opcional) */
  details?: string;
  onDismiss: () => void;
  colors: {
    card: string;
    text: string;
    muted: string;
    border: string;
    bg: string;
  };
}

/**
 * Banner inline para exibir erros no fluxo de checkout (em vez de modal).
 * Fica acima ou dentro do formulário, com mensagem e botão para fechar.
 */
export function CheckoutErrorBanner({
  title = messages.attention,
  message,
  details,
  onDismiss,
  colors,
}: CheckoutErrorBannerProps) {
  const displayText = details && details.trim() ? `${message}\n${details}` : message;

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px",
        marginBottom: "20px",
        borderRadius: "12px",
        border: "1px solid rgba(239, 68, 68, 0.4)",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
        color: colors.text,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertCircle size={22} color="#dc2626" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            marginBottom: "6px",
            color: colors.text,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.5,
            color: colors.muted,
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {displayText}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          padding: "4px",
          cursor: "pointer",
          color: colors.muted,
          borderRadius: "6px",
        }}
      >
        <X size={20} />
      </button>
    </div>
  );
}
