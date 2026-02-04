import { useCallback } from "react";
import { MapPin } from "lucide-react";
import type { ShippingAddress } from "../types";
import { buscarCep } from "../services/viaCepService";
import { normalizarCep } from "../services/freteService";

/** Máscara CEP 00000-000 */
function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

interface AddressFormProps {
  address: ShippingAddress;
  onAddressChange: (
    updater:
      | ShippingAddress
      | ((prev: ShippingAddress) => ShippingAddress),
  ) => void;
  colors: { text: string; muted: string; border: string; card: string; bg: string };
  /** Quando true, não renderiza o card wrapper (para unificar com opções de entrega) */
  embed?: boolean;
}

const inputStyle = (
  colors: { border: string; bg: string; text: string },
) => ({
  width: "100%" as const,
  padding: "12px 14px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.bg,
  color: colors.text,
  fontSize: 14,
  outline: "none" as const,
});

const labelStyle = (colors: { muted: string }) => ({
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
  display: "block" as const,
  color: colors.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
});

export function AddressForm({
  address,
  onAddressChange,
  colors,
  embed = false,
}: AddressFormProps) {
  const handleCepBlur = useCallback(async () => {
    const digits = normalizarCep(address.cep);
    if (digits.length !== 8) return;

    const data = await buscarCep(digits);
    if (data) {
      onAddressChange((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    }
  }, [address.cep, onAddressChange]);

  const updateField = useCallback(
    <K extends keyof ShippingAddress>(
      field: K,
      value: ShippingAddress[K],
    ) => {
      onAddressChange((prev) => ({ ...prev, [field]: value }));
    },
    [onAddressChange],
  );

  const inputStyles = inputStyle({
    border: colors.border,
    bg: colors.bg,
    text: colors.text,
  });

  const content = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          color: colors.text,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        <MapPin size={20} color="#10b981" /> Endereço de entrega
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle(colors)}>CEP</label>
          <input
            type="text"
            placeholder="00000-000"
            value={formatCep(address.cep)}
            onChange={(e) =>
              updateField("cep", e.target.value.replace(/\D/g, "").slice(0, 8))
            }
            onBlur={handleCepBlur}
            maxLength={9}
            style={inputStyles}
          />
        </div>

        <div>
          <label style={labelStyle(colors)}>Rua</label>
          <input
            type="text"
            placeholder="Nome da Rua"
            value={address.street}
            onChange={(e) => updateField("street", e.target.value)}
            style={inputStyles}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle(colors)}>Número</label>
            <input
              type="text"
              placeholder="Nº"
              value={address.number}
              onChange={(e) => updateField("number", e.target.value)}
              style={inputStyles}
            />
          </div>
          <div>
            <label style={labelStyle(colors)}>Bairro</label>
            <input
              type="text"
              placeholder="Bairro"
              value={address.neighborhood}
              onChange={(e) => updateField("neighborhood", e.target.value)}
              style={inputStyles}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle(colors)}>Cidade</label>
            <input
              type="text"
              placeholder="Cidade"
              value={address.city}
              onChange={(e) => updateField("city", e.target.value)}
              style={inputStyles}
            />
          </div>
          <div>
            <label style={labelStyle(colors)}>UF</label>
            <select
              value={address.state}
              onChange={(e) => updateField("state", e.target.value)}
              style={{
                ...inputStyles,
                cursor: "pointer",
                appearance: "auto",
              }}
            >
              {UF_LIST.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle(colors)}>Complemento</label>
          <input
            type="text"
            placeholder="Apto, bloco, referência..."
            value={address.complement}
            onChange={(e) => updateField("complement", e.target.value)}
            style={inputStyles}
          />
        </div>
      </div>
    </>
  );

  if (embed) {
    return <div style={{ marginBottom: 0 }}>{content}</div>;
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
