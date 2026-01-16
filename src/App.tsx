import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BackofficeLayout } from './backoffice/layouts/BackofficeLayout';
import { Login } from './backoffice/pages/Login'; // IMPORTAR AQUI
import { Products } from './backoffice/pages/Products';

// Placeholders (ainda vamos criar estes)
const Dashboard = () => <div className="p-8"><h1>Dashboard</h1><p>Bem-vindo ao painel.</p></div>;
const ProdutosList = () => <div className="p-8"><h1>Produtos</h1></div>;
const UsuariosList = () => <div className="p-8"><h1>Usuários</h1></div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota Pública - Login Real */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas */}
          <Route path="/backoffice" element={<BackofficeLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<Products />} />
            <Route path="usuarios" element={<UsuariosList />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;