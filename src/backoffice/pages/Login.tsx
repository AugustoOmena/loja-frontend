import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { Lock, Mail, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export const LoginBackoffice = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Auth do Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Verificação de Role no banco (Tabela profiles)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          console.error("Erro perfil:", profileError);
          throw new Error("Erro ao verificar permissões.");
        }

        if (profileData?.role !== "admin") {
          await supabase.auth.signOut();
          setError("Acesso negado: Conta sem privilégios de administrador.");
        } else {
          navigate("/backoffice/produtos");
        }
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Invalid login credentials")) {
        setError("E-mail ou senha incorretos.");
      } else {
        setError(msg || "Erro desconhecido ao tentar logar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Cabeçalho */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Lock size={32} color="#6366f1" /> {/* Ícone Roxo Indigo */}
          </div>
          <h1 style={styles.title}>Backoffice</h1>
          <p style={styles.subtitle}>Acesso Administrativo Seguro</p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div style={styles.errorContainer}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          {/* Input Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-MAIL CORPORATIVO</label>
            <div style={styles.inputWrapper}>
              <Mail size={20} color="#64748b" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="admin@lojaomena.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Input Senha */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>SENHA DE ACESSO</label>
            <div style={styles.inputWrapper}>
              <Lock size={20} color="#64748b" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.button}
            onMouseOver={(e) =>
              !loading &&
              (e.currentTarget.style.backgroundColor = styles.buttonHover
                .backgroundColor as string)
            }
            onMouseOut={(e) =>
              !loading &&
              (e.currentTarget.style.backgroundColor = styles.button
                .backgroundColor as string)
            }
          >
            {loading ? (
              <>
                <Loader2
                  size={20}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Verificando...
              </>
            ) : (
              <>
                Acessar Painel <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <a href="/" style={styles.link}>
            ← Voltar para a Loja
          </a>
        </div>
      </div>
    </div>
  );
};

// --- ESTILOS VISUAIS (CSS-in-JS) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a", // Slate 900 (Fundo escuro)
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "20px",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    width: "100%",
    maxWidth: "420px",
    border: "1px solid #334155",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  iconContainer: {
    width: "64px",
    height: "64px",
    backgroundColor: "#0f172a",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#f8fafc",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#cbd5e1",
    letterSpacing: "0.05em",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    transition: "border-color 0.2s",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "15px",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "14px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
    marginTop: "10px",
  },
  buttonHover: {
    backgroundColor: "#4338ca",
  },
  buttonDisabled: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "14px",
    backgroundColor: "#334155",
    color: "#94a3b8",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "not-allowed",
    marginTop: "10px",
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  footer: {
    marginTop: "32px",
    textAlign: "center",
    borderTop: "1px solid #334155",
    paddingTop: "20px",
  },
  link: {
    color: "#64748b",
    textDecoration: "none",
    fontSize: "13px",
    transition: "color 0.2s",
  },
};
