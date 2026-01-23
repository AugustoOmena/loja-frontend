import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";

// --- COMPONENTES GLOBAIS ---
import { CartDrawer } from "./components/CartDrawer";

// --- LAYOUTS ---
import { BackofficeLayout } from "./backoffice/layouts/BackofficeLayout";
import { ClientLayout } from "./store/layouts/ClientLayout"; // O layout com o Menu Bottom

// --- PÁGINAS DO BACKOFFICE ---
import { LoginBackoffice } from "./backoffice/pages/Login";
import { Products } from "./backoffice/pages/Products";
import { Users } from "./backoffice/pages/Users";
import { Dashboard } from "./backoffice/pages/Dashboard";
import { PedidosBackoffice } from "./backoffice/pages/Pedidos";

// --- PÁGINAS DA LOJA (PÚBLICAS/CLIENTE) ---
import { StoreHome } from "./store/pages/StoreHome";
import { ProductDetails } from "./store/pages/ProductDetails";
import { Login } from "./pages/Login";
import { Checkout } from "./store/pages/Checkout";
import { PixBoletoCheckout } from "./store/pages/PixBoletoCheckout";
import { CreditCardCheckout } from "./store/pages/CreditCardCheckout";

// --- NOVAS PÁGINAS DA ÁREA DO CLIENTE (QUE CRIAMOS AGORA) ---
import { Profile } from "./store/pages/client/Profile"; // A nova tela "Minha Conta"
import { OrderList } from "./store/pages/client/OrderList"; // A tela de lista de pedidos
import { Settings } from "./store/pages/client/Settings"; // A tela de configurações

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            {/* O CartDrawer flutua sobre tudo */}
            <CartDrawer />

            <Routes>
              {/* ====================================================
                  GRUPO 1: PÁGINAS COM MENU BOTTOM (ClientLayout)
                  (Início, Categorias, Carrinho*, Minha Conta)
              ==================================================== */}
              <Route path="/" element={<ClientLayout />}>
                <Route index element={<StoreHome />} />

                {/* Agora /minha-conta aponta para a nova tela PROFILE */}
                <Route path="minha-conta" element={<Profile />} />

                {/* Se tiver rota de categoria/busca no futuro, coloque aqui */}
              </Route>

              {/* ====================================================
                  GRUPO 2: PÁGINAS TELA CHEIA (SEM MENU BOTTOM)
              ==================================================== */}

              {/* Login e Detalhes */}
              <Route path="/login" element={<Login />} />
              <Route path="/produto/:id" element={<ProductDetails />} />

              {/* Checkout e Callback */}
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/auth/callback" element={<Navigate to="/" />} />
              <Route
                path="/checkout/pix-boleto"
                element={<PixBoletoCheckout />}
              />
              <Route path="/checkout/credit" element={<CreditCardCheckout />} />

              {/* Telas Internas do Cliente (Sub-telas do Minha Conta) */}
              {/* O :type captura 'pagamento', 'envio', etc. */}
              <Route path="/pedidos/:type" element={<OrderList />} />
              <Route path="/configuracoes" element={<Settings />} />

              {/* ====================================================
                  GRUPO 3: BACKOFFICE
              ==================================================== */}
              <Route path="/backoffice/login" element={<LoginBackoffice />} />

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
