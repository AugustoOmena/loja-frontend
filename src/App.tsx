import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BackofficeLayout } from './backoffice/layouts/BackofficeLayout';
import { Login } from './backoffice/pages/Login'; // IMPORTAR AQUI
import { Products } from './backoffice/pages/Products';
import { Users } from './backoffice/pages/Users';

// Placeholders (ainda vamos criar estes)
const Dashboard = () => <div className="p-8"><h1>Dashboard</h1><p>Bem-vindo ao painel.</p></div>;

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
            <Route path="usuarios" element={<Users />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;