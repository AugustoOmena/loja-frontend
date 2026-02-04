import { Truck, Loader2, AlertCircle } from "lucide-react";
import type { OpcaoFrete } from "../types";
import { normalizarCep } from "../services/freteService";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPrazo(dias: number | null): string {
  if (dias == null) return "A consultar";
  if (dias === 1) return "1 dia útil";
  return `${dias} dias úteis`;
}

interface ShippingSectionProps {
  cep: string;
  opcoes: OpcaoFrete[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (op: OpcaoFrete) => void;
  colors: { text: string; muted: string; border: string; card: string };
  /** Quando true, não renderiza o card wrapper (para unificar com endereço) */
  embed?: boolean;
}

export function ShippingSection({
  cep,
  opcoes,
  loading,
  error,
  selectedId,
  onSelect,
  colors,
  embed = false,
}: ShippingSectionProps) {
  const cepDigits = normalizarCep(cep);
  const cepValido = cepDigits.length === 8;

  const content = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 15,
          color: colors.text,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        <Truck size={20} color="#10b981" /> Opções de entrega
      </div>

      {!cepValido ? (
        <p style={{ fontSize: 14, color: colors.muted, margin: 0 }}>
          Preencha o CEP acima para ver as opções disponíveis
        </p>
      ) : loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.muted, fontSize: 14 }}>
          <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
          Buscando opções...
        </div>
      ) : error ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px",
            borderRadius: 8,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      ) : opcoes.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opcoes.map((op) => {
            const id = `${op.transportadora}-${op.preco}`;
            const isSelected = selectedId === id;
            return (
              <label
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px",
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? "#10b981" : colors.border}`,
                  backgroundColor: isSelected ? "rgba(16, 185, 129, 0.05)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="radio"
                    name="shipping"
                    value={id}
                    checked={isSelected}
                    onChange={() => onSelect(op)}
                    style={{ accentColor: "#10b981", cursor: "pointer" }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: colors.text }}>
                      {op.transportadora}
                    </span>
                    <span style={{ marginLeft: 10, fontSize: 13, color: colors.muted }}>
                      {formatPrazo(op.prazo_entrega_dias)}
                    </span>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: "#10b981", fontSize: 16 }}>
                  {formatPrice(op.preco)}
                </span>
              </label>
            );
          })}
        </div>
      ) : null}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );

  if (embed) {
    return (
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${colors.border}` }}>
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: colors.card,
        padding: "20px",
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        marginBottom: "20px",
      }}
    >
      {content}
    </div>
  );
}
