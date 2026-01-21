import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";

export const Login = () => {
  const navigate = useNavigate();

  // Estados do Formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estados de Controle de Tela
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Feedback visual
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tradutor de Erros
  const translateError = (errorMsg: string) => {
    if (errorMsg.includes("Invalid login credentials"))
      return "E-mail ou senha incorretos.";
    if (errorMsg.includes("User already registered"))
      return "Este e-mail já está cadastrado.";
    if (errorMsg.includes("Password should be at least"))
      return "A senha deve ter pelo menos 6 caracteres.";
    if (errorMsg.includes("Email not confirmed"))
      return "Verifique seu e-mail para confirmar o cadastro.";
    if (errorMsg.includes("rate limit"))
      return "Muitas tentativas. Aguarde um pouco.";
    return "Ocorreu um erro. Tente novamente.";
  };

  const resetFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetFeedback();

    try {
      if (isRegister) {
        await authService.signUp(email, password);
        setSuccessMessage("Cadastro realizado! Verifique seu e-mail.");
        setIsRegister(false);
      } else {
        await authService.signIn(email, password);
        navigate("/");
      }
    } catch (error: any) {
      setErrorMessage(translateError(error.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Digite seu e-mail para recuperar a senha.");
      return;
    }

    setLoading(true);
    resetFeedback();

    try {
      await authService.sendPasswordReset(email);
      setSuccessMessage(
        "E-mail de recuperação enviado! Verifique sua caixa de entrada.",
      );
    } catch (error: any) {
      setErrorMessage(translateError(error.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.signInWithGoogle();
    } catch {
      setErrorMessage("Erro ao conectar com Google.");
    }
  };

  const getTitle = () => {
    if (isForgotPassword) return "Recuperar Senha";
    if (isRegister) return "Criar Conta";
    return "Bem-vindo";
  };

  // Estilo base para os inputs
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: errorMessage ? "1px solid #ef4444" : "1px solid #e2e8f0", // Borda cinza suave
    fontSize: "15px",
    outline: "none",
    backgroundColor: "white", // Força fundo branco
    color: "#333", // Força texto escuro
    boxSizing: "border-box", // Evita que padding aumente a largura
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5", // Fundo da página cinza claro
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white", // Card branco
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          width: "100%",
          maxWidth: "400px",
          position: "relative",
        }}
      >
        {/* --- BOTÃO VOLTAR PARA A LOJA --- */}
        <button
          onClick={() => navigate("/")}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "13px",
            fontWeight: "500",
          }}
          title="Voltar para a loja"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
            marginTop: "15px",
            color: "#1e293b",
            fontSize: "24px",
            fontWeight: "800",
          }}
        >
          {getTitle()}
        </h1>

        {!isForgotPassword && (
          <>
            <button
              onClick={handleGoogleLogin}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "20px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                cursor: "pointer",
                fontSize: "15px",
                color: "#475569",
                fontWeight: "500",
                transition: "0.2s",
              }}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                style={{ width: "20px" }}
              />
              Continuar com Google
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ height: "1px", flex: 1, backgroundColor: "#e2e8f0" }}
              ></div>
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                ou use email
              </span>
              <div
                style={{ height: "1px", flex: 1, backgroundColor: "#e2e8f0" }}
              ></div>
            </div>
          </>
        )}

        {/* MENSAGEM DE SUCESSO */}
        {successMessage && (
          <div
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "15px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <CheckCircle size={18} /> {successMessage}
          </div>
        )}

        {/* --- FORMULÁRIO --- */}
        <form
          onSubmit={isForgotPassword ? handleResetPassword : handleEmailAuth}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          {isForgotPassword && (
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                textAlign: "center",
                marginBottom: "5px",
                lineHeight: "1.5",
              }}
            >
              Digite seu e-mail e enviaremos um link para você redefinir sua
              senha.
            </p>
          )}

          <input
            type="email"
            placeholder="Seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          {!isForgotPassword && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <input
                type="password"
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />

              {!isRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    resetFeedback();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "13px",
                    cursor: "pointer",
                    alignSelf: "flex-end",
                    marginTop: "8px",
                    fontWeight: "500",
                  }}
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
          )}

          {/* MENSAGEM DE ERRO */}
          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#ef4444",
                fontSize: "13px",
                marginTop: "-5px",
              }}
            >
              <AlertCircle size={14} /> <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#0f172a",
              color: "white",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "10px",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading
              ? "Carregando..."
              : isForgotPassword
                ? "Enviar E-mail"
                : isRegister
                  ? "Cadastrar"
                  : "Entrar"}
          </button>
        </form>

        <div
          style={{
            marginTop: "25px",
            textAlign: "center",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                resetFeedback();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#0f172a",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Voltar para o Login
            </button>
          ) : (
            <>
              {isRegister ? "Já tem conta?" : "Não tem conta?"}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  resetFeedback();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0f172a",
                  fontWeight: "bold",
                  marginLeft: "5px",
                  cursor: "pointer",
                }}
              >
                {isRegister ? "Fazer Login" : "Cadastre-se"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
