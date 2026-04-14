import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../services/supabaseClient";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [isValidRecovery, setIsValidRecovery] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hashType = useMemo(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    return params.get("type");
  }, []);

  useEffect(() => {
    let mounted = true;

    const validateRecovery = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const hasSession = Boolean(data.session?.user);
        const isRecoveryType = hashType === "recovery";
        setIsValidRecovery(hasSession || isRecoveryType);
      } finally {
        if (mounted) setCheckingLink(false);
      }
    };

    validateRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && !!session?.user)) {
        setIsValidRecovery(true);
        setCheckingLink(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hashType]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccessMessage("Senha redefinida com sucesso. Redirecionando para o login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error?.message || "Nao foi possivel redefinir a senha.");
    } finally {
      setLoading(false);
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
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "28px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: "10px",
            color: "#1e293b",
            fontSize: "24px",
            textAlign: "center",
          }}
        >
          Redefinir senha
        </h1>
        <p
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#64748b",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Digite sua nova senha para concluir a recuperacao da conta.
        </p>

        {checkingLink ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "12px 0" }}>
            <Loader2 className="animate-spin" size={24} style={{ marginBottom: 8 }} />
            Validando link...
          </div>
        ) : !isValidRecovery ? (
          <div>
            <div
              style={{
                backgroundColor: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              Link invalido ou expirado. Solicite um novo e-mail de recuperacao.
            </div>
            <button
              onClick={() => navigate("/login")}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0f172a",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
            <input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />

            {errorMessage && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "13px",
                }}
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  backgroundColor: "#ecfdf5",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "13px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <CheckCircle2 size={16} />
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "4px",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0f172a",
                color: "white",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
