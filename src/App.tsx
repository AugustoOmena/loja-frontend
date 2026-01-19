import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Backoffice
import { BackofficeLayout } from "./backoffice/layouts/BackofficeLayout";
import { LoginBackoffice } from "./backoffice/pages/Login";
import { Products } from "./backoffice/pages/Products";
import { Users } from "./backoffice/pages/Users";

// Loja (Páginas Públicas)
import { StoreHome } from "./store/pages/StoreHome";
import { ProductDetails } from "./store/pages/ProductDetails";
import { UserProfile } from "./store/pages/UserProfile";
import { Login } from "./pages/Login";
import { Checkout } from "./store/pages/Checkout"; // <--- NOVA ROTA

// Área do Cliente
import { ClientLayout } from "./store/layouts/ClientLayout";
import { MyOrders } from "./store/pages/client/MyOrders";
import { MyData } from "./store/pages/client/MyData";

// Contextos e Componentes Globais (Carrinho)
import { CartProvider } from "./contexts/CartContext";
import { CartDrawer } from "./components/CartDrawer";

// Placeholder Dashboard Backoffice
const Dashboard = () => (
  <div className="p-8">
    <h1>Dashboard</h1>
    <p>Bem-vindo ao painel administrativo.</p>
  </div>
);

function App() {
  return (
    // 1. Auth envolve tudo (para saber se tem usuário logado)
    <AuthProvider>
      {/* 2. CartProvider envolve a navegação (para o carrinho funcionar em qualquer página) */}
      <CartProvider>
        <BrowserRouter>
          {/* 3. O CartDrawer fica AQUI. Ele precisa estar dentro do BrowserRouter 
                 para navegar, mas fora do Routes para flutuar por cima de tudo. */}
          <CartDrawer />

          <Routes>
            {/* --- LOJA PÚBLICA --- */}
            <Route path="/" element={<StoreHome />} />
            <Route path="/produto/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/minha-conta" element={<UserProfile />} />{" "}
            {/* Rota legada, pode manter ou remover */}
            {/* NOVA ROTA DE CHECKOUT */}
            <Route path="/checkout" element={<Checkout />} />
            {/* Rota de retorno do Google (Opcional, mas boa prática) */}
            <Route path="/auth/callback" element={<Navigate to="/" />} />
            {/* --- BACKOFFICE (Protegido) --- */}
            <Route path="/backoffice" element={<BackofficeLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="produtos" element={<Products />} />
              <Route path="usuarios" element={<Users />} />
            </Route>
            <Route path="backoffice/login" element={<LoginBackoffice />} />
            {/* --- ÁREA DO CLIENTE (Protegida) --- */}
            <Route path="/minha-conta" element={<ClientLayout />}>
              {/* Se entrar só em /minha-conta, joga para /pedidos */}
              <Route index element={<Navigate to="/minha-conta/pedidos" />} />

              <Route path="pedidos" element={<MyOrders />} />
              <Route path="dados" element={<MyData />} />
              <Route path="dashboard" element={<MyOrders />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
