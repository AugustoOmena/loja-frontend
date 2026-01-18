import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BackofficeLayout } from "./backoffice/layouts/BackofficeLayout";
import { LoginBackoffice } from "./backoffice/pages/Login";
import { Products } from "./backoffice/pages/Products";
import { Users } from "./backoffice/pages/Users";
import { StoreHome } from "./store/pages/StoreHome";
import { ProductDetails } from "./store/pages/ProductDetails";
import { UserProfile } from "./store/pages/UserProfile";
import { Login } from "./pages/Login";
import { ClientLayout } from "./store/layouts/ClientLayout";
import { MyOrders } from "./store/pages/client/MyOrders";
import { MyData } from "./store/pages/client/MyData";

// Placeholders (ainda vamos criar estes)
const Dashboard = () => (
  <div className="p-8">
    <h1>Dashboard</h1>
    <p>Bem-vindo ao painel.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StoreHome />} />

          {/* Rota Pública - Login Real */}
          <Route path="/login" element={<Login />} />
          <Route path="/produto/:id" element={<ProductDetails />} />
          <Route path="/minha-conta" element={<UserProfile />} />

          {/* Rotas Protegidas */}
          <Route path="/backoffice" element={<BackofficeLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<Products />} />
            <Route path="usuarios" element={<Users />} />
          </Route>

          {/* ÁREA DO CLIENTE (Protegida) */}
          <Route path="/minha-conta" element={<ClientLayout />}>
            {/* Se entrar só em /minha-conta, joga para /pedidos */}
            <Route index element={<Navigate to="/minha-conta/pedidos" />} />

            <Route path="pedidos" element={<MyOrders />} />
            <Route path="dados" element={<MyData />} />

            {/* Rota Dashboard (pode ser a mesma de pedidos por enquanto) */}
            <Route path="dashboard" element={<MyOrders />} />
          </Route>

          <Route path="backoffice/login" element={<LoginBackoffice />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
