import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Lock, User, ArrowRight } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Tenta Login (Auth)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Verifica se é Admin (Banco)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
           // Se der erro ao buscar perfil, assume que algo está errado
           throw new Error("Erro ao verificar permissões.");
        }

        if (profileData.role !== 'admin') {
          // É usuário, mas não admin. Expulsa.
          await supabase.auth.signOut();
          setError("Acesso restrito a administradores.");
        } else {
          // Sucesso total
          navigate('/backoffice');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message === "Invalid login credentials" 
        ? "E-mail ou senha incorretos." 
        : err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Lock size={32} color="#fff" />
          </div>
          <h1 style={styles.title}>Backoffice</h1>
          <p style={styles.subtitle}>Acesso Administrativo</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail</label>
            <div style={styles.inputWrapper}>
              <User size={20} color="#94a3b8" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="admin@exemplo.com"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <div style={styles.inputWrapper}>
              <Lock size={20} color="#94a3b8" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={loading ? styles.buttonDisabled : styles.button}>
            {loading ? 'Verificando...' : (
              <>Entrar <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Estilos simples (CSS-in-JS)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif'
  },
  card: {
    backgroundColor: 'white', padding: '40px', borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', width: '100%', maxWidth: '400px'
  },
  header: { textAlign: 'center' as const, marginBottom: '30px' },
  iconContainer: {
    width: '60px', height: '60px', backgroundColor: '#0f172a', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px'
  },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '5px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#334155' },
  inputWrapper: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px',
    border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc'
  },
  input: {
    border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: '16px'
  },
  button: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '12px', backgroundColor: '#0f172a', color: 'white', border: 'none',
    borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
    marginTop: '10px', transition: 'background 0.2s'
  },
  buttonDisabled: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '12px', backgroundColor: '#94a3b8', color: 'white', border: 'none',
    borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'not-allowed', marginTop: '10px'
  },
  error: {
    padding: '10px', backgroundColor: '#fef2f2', color: '#ef4444',
    borderRadius: '6px', fontSize: '14px', textAlign: 'center' as const
  }
};