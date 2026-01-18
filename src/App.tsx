import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BackofficeLayout } from "./backoffice/layouts/BackofficeLayout";
import { Login } from "./backoffice/pages/Login";
import { Products } from "./backoffice/pages/Products";
import { Users } from "./backoffice/pages/Users";
import { StoreHome } from "./store/pages/StoreHome";
import { ProductDetails } from "./store/pages/ProductDetails";
import { UserProfile } from "./store/pages/UserProfile";

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

          {/* Rotas Protegidas */}
          <Route path="/backoffice" element={<BackofficeLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<Products />} />
            <Route path="usuarios" element={<Users />} />
          </Route>

          <Route path="/produto/:id" element={<ProductDetails />} />
          <Route path="/minha-conta" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
