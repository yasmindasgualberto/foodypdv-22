
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import PDV from "./pages/PDV";
import PDVMobile from "./pages/PDVMobile";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
import KDS from "./pages/KDS";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Cashier from "./pages/Cashier";
import Settings from "./pages/Settings";
import Index from "./pages/Index";
import "./App.css";
import { ProductProvider } from "./context/ProductContext";
import { StockProvider } from "./context/StockContext";
import { OrderProvider } from "./context/OrderContext";
import { useIsMobile } from "./hooks/use-mobile";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function App() {
  const isMobile = useIsMobile();

  // Redirecionar para a versão mobile do PDV em dispositivos móveis
  useEffect(() => {
    if (isMobile && window.location.pathname === "/pdv") {
      window.location.href = "/pdv-mobile";
    }
  }, [isMobile]);

  return (
    <AuthProvider>
      <ProductProvider>
        <StockProvider>
          <OrderProvider>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Rotas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pdv" element={<PDV />} />
                <Route path="/pdv-mobile" element={<PDVMobile />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/products" element={<Products />} /> {/* Rota em inglês */}
                <Route path="/categorias" element={<Categories />} />
                <Route path="/categories" element={<Categories />} /> {/* Adicionando rota em inglês */}
                <Route path="/estoque" element={<Stock />} />
                <Route path="/stock" element={<Stock />} /> {/* Adicionando rota em inglês */}
                <Route path="/kds" element={<KDS />} />
                <Route path="/pedidos" element={<Orders />} />
                <Route path="/orders" element={<Orders />} /> {/* Adicionando rota em inglês */}
                <Route path="/caixa" element={<Cashier />} />
                <Route path="/cashier" element={<Cashier />} /> {/* Rota em inglês */}
                <Route path="/configuracoes" element={<Settings />} /> {/* Corrigindo rota em português */}
                <Route path="/configuracoes/*" element={<Settings />} />
                <Route path="/settings" element={<Settings />} /> {/* Adicionando rota em inglês */}
                <Route path="/settings/*" element={<Settings />} /> {/* Adicionando rota em inglês com sub-rotas */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            
            <Toaster position="top-right" richColors />
          </OrderProvider>
        </StockProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;
