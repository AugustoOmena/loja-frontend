import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { AddressProvider } from "./contexts/AddressContext";

// --- COMPONENTES GLOBAIS ---
import { CartDrawer } from "./components/CartDrawer";
import { PrivateRoute } from "./components/PrivateRoute";

// --- LAYOUTS ---
import { BackofficeLayout } from "./backoffice/layouts/BackofficeLayout";
import { ClientLayout } from "./store/layouts/ClientLayout";

// --- PÁGINAS ---
import { LoginBackoffice } from "./backoffice/pages/Login";
import { Products } from "./backoffice/pages/Products";
import { Users } from "./backoffice/pages/Users";
import { Dashboard } from "./backoffice/pages/Dashboard";
import { PedidosBackoffice } from "./backoffice/pages/Pedidos";

import { StoreHome } from "./store/pages/StoreHome";
import { ProductDetails } from "./store/pages/ProductDetails";
import { Login } from "./pages/Login";
import { AuthCallback } from "./pages/AuthCallback";
import { Checkout } from "./store/pages/Checkout";
import { PixBoletoCheckout } from "./store/pages/PixBoletoCheckout";
import { CreditCardCheckout } from "./store/pages/CreditCardCheckout";

import { Profile } from "./store/pages/client/Profile";
import { OrderList } from "./store/pages/client/OrderList";
import { Settings } from "./store/pages/client/Settings";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <CartDrawer />

            <Routes>
              {/* ====================================================
                  ROTAS PÚBLICAS (Qualquer um acessa)
              ==================================================== */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/backoffice/login" element={<LoginBackoffice />} />

              {/* Layout Principal da Loja (Com Menu Bottom) */}
              <Route path="/" element={<ClientLayout />}>
                <Route index element={<StoreHome />} />
                <Route path="produto/:id" element={<ProductDetails />} />

                {/* PROTEÇÃO 1: Minha Conta (Dentro do layout com menu) 
                   Aninhamos dentro do PrivateRoute
                */}
                <Route element={<PrivateRoute />}>
                  <Route path="minha-conta" element={<Profile />} />
                </Route>
              </Route>

              {/* ====================================================
                  ROTAS PROTEGIDAS (CHECKOUT & CLIENTE)
                  Se tentar entrar aqui sem logar, vai pro Login
              ==================================================== */}
              <Route element={<PrivateRoute />}>
                {/* Checkout Flow - AddressProvider só aqui para não afetar ProductDetails/StoreHome */}
                <Route
                  path="/checkout"
                  element={
                    <AddressProvider>
                      <Outlet />
                    </AddressProvider>
                  }
                >
                  <Route index element={<Checkout />} />
                  <Route path="credit" element={<CreditCardCheckout />} />
                  <Route path="pix-boleto" element={<PixBoletoCheckout />} />
                </Route>

                {/* Sub-páginas do Cliente (Fora do menu bottom se desejar, ou dentro) */}
                <Route path="/pedidos/:type" element={<OrderList />} />
                <Route path="/configuracoes" element={<Settings />} />
              </Route>

              {/* ====================================================
                  ROTAS DO BACKOFFICE (Proteção Admin)
                  (Idealmente criar um <AdminRoute> separado depois)
              ==================================================== */}
              <Route path="/backoffice" element={<BackofficeLayout />}>
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="produtos" element={<Products />} />
                <Route path="usuarios" element={<Users />} />
                <Route path="pedidos" element={<PedidosBackoffice />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
