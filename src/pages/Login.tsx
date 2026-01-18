import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { AlertCircle } from "lucide-react"; // Ícone de erro opcional

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // ESTADO PARA MENSAGEM DE ERRO
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tradutor de Erros do Supabase
  const translateError = (errorMsg: string) => {
    if (errorMsg.includes("Invalid login credentials"))
      return "E-mail ou senha incorretos.";
    if (errorMsg.includes("User already registered"))
      return "Este e-mail já está cadastrado.";
    if (errorMsg.includes("Password should be at least"))
      return "A senha deve ter pelo menos 6 caracteres.";
    if (errorMsg.includes("Email not confirmed"))
      return "Verifique seu e-mail para confirmar o cadastro.";
    return "Ocorreu um erro. Tente novamente.";
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null); // Limpa erros anteriores
    setSuccessMessage(null);

    try {
      if (isRegister) {
        // CORREÇÃO: Chama o método signUp que criamos agora
        await authService.signUp(email, password);
        setSuccessMessage(
          "Cadastro realizado! Verifique seu e-mail para confirmar.",
        );
        setIsRegister(false); // Volta para tela de login
      } else {
        await authService.signIn(email, password);
        navigate("/");
      }
    } catch (error: any) {
      // Traduz e define o erro
      setErrorMessage(translateError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      setErrorMessage("Erro ao conectar com Google.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: "#333",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          {isRegister ? "Criar Conta" : "Bem-vindo"}
        </h1>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            fontSize: "15px",
            color: "#555",
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
            style={{ height: "1px", flex: 1, backgroundColor: "#eee" }}
          ></div>
          <span style={{ color: "#999", fontSize: "12px" }}>ou use email</span>
          <div
            style={{ height: "1px", flex: 1, backgroundColor: "#eee" }}
          ></div>
        </div>

        {/* MENSAGEM DE SUCESSO (Cadastro) */}
        {successMessage && (
          <div
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            {successMessage}
          </div>
        )}

        <form
          onSubmit={handleEmailAuth}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <input
            type="email"
            placeholder="Seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: errorMessage ? "1px solid #ef4444" : "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
            }}
          />

          <input
            type="password"
            placeholder="Sua senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: errorMessage ? "1px solid #ef4444" : "1px solid #ddd",
              fontSize: "15px",
              outline: "none",
            }}
          />

          {/* MENSAGEM DE ERRO (EM PORTUGUÊS) */}
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
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
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
            }}
          >
            {loading ? "Carregando..." : isRegister ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "14px",
            color: "#666",
          }}
        >
          {isRegister ? "Já tem conta?" : "Não tem conta?"}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMessage(null);
              setSuccessMessage(null);
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
        </div>
      </div>
    </div>
  );
};
