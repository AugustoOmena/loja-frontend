import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

export const TermosDeUso = () => {
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
          Termos de Uso e Privacidade
        </h1>
        <p style={{ color: colors.muted, fontSize: "14px", marginBottom: "40px" }}>
          Última atualização: maio de 2025
        </p>

        <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted, marginBottom: "32px" }}>
          Ao utilizar nossa loja, você concorda com os termos descritos neste documento. Leia com atenção
          antes de realizar seu cadastro ou efetuar uma compra.
        </p>

        {[
          {
            title: "1. Quem somos",
            content: (
              <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted }}>
                Somos uma loja virtual brasileira dedicada à venda de produtos de moda e acessórios.
                Operamos exclusivamente de forma online e nos comprometemos a oferecer uma experiência
                de compra segura, transparente e de qualidade.
              </p>
            ),
          },
          {
            title: "2. Dados que coletamos",
            content: (
              <>
                <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted, marginBottom: "12px" }}>
                  Para viabilizar sua compra e manter a segurança da conta, coletamos:
                </p>
                <ul
                  style={{
                    paddingLeft: "20px",
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: colors.muted,
                  }}
                >
                  <li>
                    <strong style={{ color: colors.text }}>Dados de identificação:</strong> nome completo e
                    endereço de e-mail (cadastro e login).
                  </li>
                  <li>
                    <strong style={{ color: colors.text }}>Dados de contato:</strong> número de telefone
                    (informado no checkout).
                  </li>
                  <li>
                    <strong style={{ color: colors.text }}>Endereço de entrega:</strong> CEP, logradouro,
                    número, complemento, bairro, cidade e estado.
                  </li>
                  <li>
                    <strong style={{ color: colors.text }}>Dados de pagamento:</strong> processados diretamente
                    pelo Mercado Pago. Não armazenamos dados de cartão em nossos servidores.
                  </li>
                  <li>
                    <strong style={{ color: colors.text }}>Dados de navegação:</strong> páginas visitadas,
                    produtos visualizados e itens adicionados ao carrinho, usados para melhorar a experiência.
                  </li>
                </ul>
              </>
            ),
          },
          {
            title: "3. Como usamos seus dados",
            content: (
              <ul
                style={{
                  paddingLeft: "20px",
                  fontSize: "15px",
                  lineHeight: "1.8",
                  color: colors.muted,
                }}
              >
                <li>Processar e entregar seus pedidos.</li>
                <li>Enviar atualizações sobre o status do pedido por e-mail.</li>
                <li>Permitir o acesso à sua conta e histórico de compras.</li>
                <li>Calcular opções de frete com base no seu CEP.</li>
                <li>Prevenir fraudes e garantir a segurança das transações.</li>
                <li>Melhorar nossos produtos, preços e experiência de navegação.</li>
              </ul>
            ),
          },
          {
            title: "4. Compartilhamento de dados",
            content: (
              <>
                <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted, marginBottom: "12px" }}>
                  Seus dados são compartilhados apenas com parceiros essenciais para a operação:
                </p>
                <ul
                  style={{
                    paddingLeft: "20px",
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: colors.muted,
                  }}
                >
                  <li>
                    <strong style={{ color: colors.text }}>Transportadoras / Correios:</strong> nome e
                    endereço completo para entrega do pedido.
                  </li>
                  <li>
                    <strong style={{ color: colors.text }}>Mercado Pago:</strong> dados necessários para
                    processar o pagamento de forma segura.
                  </li>
                  <li>
                    <strong style={{ color: colors.text }}>Melhor Envio:</strong> dados de frete e endereço
                    para cálculo e etiqueta de envio.
                  </li>
                </ul>
                <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted, marginTop: "12px" }}>
                  Não vendemos, alugamos ou cedemos seus dados a terceiros para fins de marketing.
                </p>
              </>
            ),
          },
          {
            title: "5. Retenção de dados",
            content: (
              <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted }}>
                Mantemos seus dados enquanto sua conta estiver ativa ou pelo prazo exigido por
                obrigações legais (como registros fiscais). Você pode solicitar a exclusão da sua conta
                e dados a qualquer momento pelo suporte — desde que não haja pedido em aberto ou
                obrigação legal de retenção.
              </p>
            ),
          },
          {
            title: "6. Segurança",
            content: (
              <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted }}>
                Utilizamos autenticação segura via Supabase Auth (com suporte a OAuth), comunicação
                criptografada (HTTPS) e armazenamento em infraestrutura com controle de acesso.
                Dados de pagamento trafegam exclusivamente pelos servidores do Mercado Pago, certificados
                PCI-DSS.
              </p>
            ),
          },
          {
            title: "7. Seus direitos (LGPD)",
            content: (
              <>
                <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted, marginBottom: "12px" }}>
                  Nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:
                </p>
                <ul
                  style={{
                    paddingLeft: "20px",
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: colors.muted,
                  }}
                >
                  <li>Confirmar a existência do tratamento dos seus dados.</li>
                  <li>Acessar os dados que temos sobre você.</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                  <li>Solicitar a anonimização, bloqueio ou exclusão de dados desnecessários.</li>
                  <li>Revogar o consentimento a qualquer momento.</li>
                </ul>
                <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted, marginTop: "12px" }}>
                  Para exercer qualquer desses direitos, entre em contato com nosso suporte.
                </p>
              </>
            ),
          },
          {
            title: "8. Cookies",
            content: (
              <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted }}>
                Utilizamos cookies e armazenamento local (localStorage) para manter sua sessão ativa,
                lembrar preferências de tema e itens do carrinho. Não utilizamos cookies de rastreamento
                de terceiros para publicidade.
              </p>
            ),
          },
          {
            title: "9. Alterações nestes termos",
            content: (
              <p style={{ fontSize: "15px", lineHeight: "1.7", color: colors.muted }}>
                Podemos atualizar estes termos periodicamente. Em caso de alterações relevantes,
                notificaremos os usuários por e-mail ou mediante aviso na plataforma. O uso continuado
                da loja após as alterações constitui aceite dos novos termos.
              </p>
            ),
          },
        ].map(({ title, content }) => (
          <section key={title} style={{ marginBottom: "36px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "14px",
                paddingBottom: "10px",
                borderBottom: `2px solid #F4D636`,
                color: colors.text,
              }}
            >
              {title}
            </h2>
            {content}
          </section>
        ))}

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
          Dúvidas sobre privacidade ou seus dados? Entre em contato pelo nosso suporte.
        </div>
      </div>
    </div>
  );
};
