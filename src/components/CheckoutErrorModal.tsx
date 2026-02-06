import { AlertCircle, X } from "lucide-react";

interface CheckoutErrorModalProps {
  open: boolean;
  title?: string;
  message: string;
  details?: string;
  onClose: () => void;
  colors: { card: string; text: string; muted: string; border: string; bg: string };
}

export const CheckoutErrorModal = ({
  open,
  title = "Atenção",
  message,
  details,
  onClose,
  colors,
}: CheckoutErrorModalProps) => {
  if (!open) return null;

  const displayText = details && details.trim() ? details : message;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-error-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.card,
          padding: "20px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "min(400px, calc(100vw - 32px))",
          maxHeight: "85vh",
          overflow: "auto",
          color: colors.text,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
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
            <AlertCircle size={24} color="#dc2626" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="checkout-error-title"
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "8px",
                color: colors.text,
              }}
            >
              {title}
            </h2>
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
            onClick={onClose}
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
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "12px 16px",
            backgroundColor: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
};
