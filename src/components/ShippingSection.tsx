import { Truck, Loader2, AlertCircle } from "lucide-react";
import type { OpcaoFrete } from "../types";
import { normalizarCep } from "../services/freteService";

/** Máscara CEP 00000-000 */
function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

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
  onCepChange: (cep: string) => void;
  opcoes: OpcaoFrete[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (op: OpcaoFrete) => void;
  onCalcular: () => void;
  colors: { text: string; muted: string; border: string; card: string };
}

export function ShippingSection({
  cep,
  onCepChange,
  opcoes,
  loading,
  error,
  selectedId,
  onSelect,
  onCalcular,
  colors,
}: ShippingSectionProps) {
  const cepDigits = normalizarCep(cep);
  const canCalcular = cepDigits.length === 8;

  const handleCepBlur = () => {
    onCepChange(formatCep(cep));
  };

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
        <Truck size={20} color="#10b981" /> Calcular frete
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 15, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="00000-000"
          value={formatCep(cep)}
          onChange={(e) => onCepChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
          onBlur={handleCepBlur}
          maxLength={9}
          style={{
            flex: 1,
            minWidth: 140,
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            backgroundColor: "transparent",
            color: colors.text,
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={onCalcular}
          disabled={!canCalcular || loading}
          style={{
            padding: "12px 20px",
            background: canCalcular && !loading ? "#10b981" : "#94a3b8",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: canCalcular && !loading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" style={{ animation: "spin 0.8s linear infinite" }} />
          ) : (
            "Calcular"
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px",
            marginBottom: 15,
            borderRadius: 8,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {opcoes.length > 0 && (
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
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
