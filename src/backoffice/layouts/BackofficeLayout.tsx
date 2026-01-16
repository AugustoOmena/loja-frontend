import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, LogOut } from 'lucide-react'; // Ícones
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export const BackofficeLayout = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Proteção simples: Se não for admin, chuta pro login
  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login');
      else if (role !== 'admin') {
        alert("Acesso negado. Apenas admins.");
        signOut();
      }
    }
  }, [user, role, loading, navigate, signOut]);

  if (loading) return <div className="p-10">Carregando sistema...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar - Estilização inline simples por enquanto */}
      <aside style={{ width: '250px', background: '#1e293b', color: 'white', padding: '20px' }}>
        <h2 style={{ marginBottom: '30px', fontSize: '1.5rem', fontWeight: 'bold' }}>Admin Loja</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/backoffice" style={linkStyle}><LayoutDashboard size={20}/> Dashboard</Link>
          <Link to="/backoffice/produtos" style={linkStyle}><ShoppingBag size={20}/> Produtos</Link>
          <Link to="/backoffice/usuarios" style={linkStyle}><Users size={20}/> Usuários</Link>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #334155' }}>
          <button onClick={() => { signOut(); navigate('/login'); }} style={{...linkStyle, background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171'}}>
            <LogOut size={20}/> Sair
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main style={{ flex: 1, padding: '40px', background: '#f1f5f9' }}>
        <Outlet /> 
      </main>
    </div>
  );
};

const linkStyle = { display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', textDecoration: 'none', padding: '10px', borderRadius: '5px' };