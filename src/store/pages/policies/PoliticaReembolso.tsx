import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

export const PoliticaReembolso = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        minHeight: "100vh",
        fontFamily: "sans-serif",
        color: colors.text,
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "40px 20px 80px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            color: colors.muted,
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            marginBottom: "32px",
            padding: 0,
          }}
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: "800",
            marginBottom: "8px",
            color: colors.text,
          }}
        >
          Reembolso e Devoluções
        </h1>
        <p style={{ color: colors.muted, fontSize: "14px", marginBottom: "40px" }}>
          Última atualização: maio de 2025
        </p>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "16px",
              paddingBottom: "10px",
              borderBottom: `2px solid #F4D636`,
              color: colors.text,
            }}
          >
            Política de Reembolso
          </h2>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
            Prazo para solicitação
          </h3>
          <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted, marginBottom: "20px" }}>
            Você pode solicitar o reembolso em até <strong style={{ color: colors.text }}>7 dias corridos</strong> após
            o recebimento do produto, conforme o Código de Defesa do Consumidor (Lei 8.078/1990).
            Para produtos com defeito, o prazo é de <strong style={{ color: colors.text }}>30 dias</strong> para bens
            não-duráveis e <strong style={{ color: colors.text }}>90 dias</strong> para bens duráveis.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
            Como solicitar o reembolso
          </h3>
          <ol
            style={{
              paddingLeft: "20px",
              fontSize: "15px",
              lineHeight: "1.8",
              color: colors.muted,
              marginBottom: "20px",
            }}
          >
            <li>Entre em contato com nosso suporte pelo e-mail ou WhatsApp informados na loja.</li>
            <li>Informe o número do pedido e o motivo da solicitação.</li>
            <li>Aguarde nossa confirmação em até 2 dias úteis.</li>
            <li>Após a aprovação, o reembolso é processado conforme o método de pagamento utilizado.</li>
          </ol>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
            Prazos de reembolso por forma de pagamento
          </h3>
          <ul
            style={{
              paddingLeft: "20px",
              fontSize: "15px",
              lineHeight: "1.8",
              color: colors.muted,
              marginBottom: "20px",
            }}
          >
            <li>
              <strong style={{ color: colors.text }}>Pix:</strong> crédito em conta em até 3 dias úteis após aprovação.
            </li>
            <li>
              <strong style={{ color: colors.text }}>Cartão de Crédito:</strong> estorno na fatura em até 2 ciclos de
              cobrança (a depender da operadora).
            </li>
            <li>
              <strong style={{ color: colors.text }}>Boleto Bancário:</strong> depósito em conta em até 5 dias úteis
              após aprovação — é necessário informar dados bancários.
            </li>
          </ul>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
            Situações em que o reembolso não se aplica
          </h3>
          <ul
            style={{
              paddingLeft: "20px",
              fontSize: "15px",
              lineHeight: "1.8",
              color: colors.muted,
            }}
          >
            <li>Produto com sinais claros de uso inadequado ou dano intencional.</li>
            <li>Solicitação fora do prazo estipulado.</li>
            <li>Produto personalizado ou produzido sob encomenda.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "16px",
              paddingBottom: "10px",
              borderBottom: `2px solid #F4D636`,
              color: colors.text,
            }}
          >
            Regras de Devolução
          </h2>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
            Prazo
          </h3>
          <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted, marginBottom: "20px" }}>
            A devolução deve ser iniciada em até <strong style={{ color: colors.text }}>7 dias corridos</strong> a
            partir da data de entrega. Após a abertura da solicitação, o produto deve ser postado em no
            máximo <strong style={{ color: colors.text }}>5 dias úteis</strong>.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
            Condições do produto para devolução
          </h3>
          <ul
            style={{
              paddingLeft: "20px",
              fontSize: "15px",
              lineHeight: "1.8",
              color: colors.muted,
              marginBottom: "20px",
            }}
          >
            <li>O produto deve estar sem uso, lavado (quando aplicável) e na embalagem original.</li>
            <li>Etiquetas e acessórios originais devem estar presentes.</li>
            <li>Não aceitamos devoluções de peças de roupa íntima por motivos higiênicos.</li>
            <li>Para defeitos de fabricação, o produto pode estar usado desde que o defeito seja evidenciado.</li>
          </ul>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
            Processo de devolução
          </h3>
          <ol
            style={{
              paddingLeft: "20px",
              fontSize: "15px",
              lineHeight: "1.8",
              color: colors.muted,
              marginBottom: "20px",
            }}
          >
            <li>Abra a solicitação pelo nosso suporte informando o número do pedido e fotos do produto.</li>
            <li>Após aprovação, enviaremos a etiqueta de postagem gratuita por e-mail.</li>
            <li>Poste o produto nos Correios ou no ponto indicado.</li>
            <li>Ao recebermos o produto e confirmarmos as condições, processamos o reembolso ou troca.</li>
          </ol>

          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: colors.text }}>
            Custo do frete de devolução
          </h3>
          <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted }}>
            O frete de devolução é por nossa conta nos casos de produto com defeito ou erro nosso no envio.
            Em caso de arrependimento (direito de desistência), o frete pode ser de responsabilidade do
            cliente — verifique as condições ao abrir a solicitação.
          </p>
        </section>

        <div
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "20px 24px",
            fontSize: "14px",
            color: colors.muted,
            lineHeight: "1.6",
          }}
        >
          Dúvidas? Entre em contato com nosso suporte. Respondemos em até 1 dia útil.
        </div>
      </div>
    </div>
  );
};
