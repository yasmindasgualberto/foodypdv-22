
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OrderProvider } from "./context/OrderContext";
import { StockProvider } from "./context/StockContext";
import { ProductProvider } from "./context/ProductContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import PDVMobile from "./pages/PDVMobile";
import KDS from "./pages/KDS";
import Stock from "./pages/Stock";
import Cashier from "./pages/Cashier";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

import { useIsMobile } from "./hooks/use-mobile";

const queryClient = new QueryClient();

// Componente para lidar com redirecionamento inteligente para PDV
const PDVRedirect = () => {
  const isMobile = useIsMobile();
  return isMobile ? <Navigate to="/pdv-mobile" /> : <PDV />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <StockProvider>
            <ProductProvider>
              <OrderProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Rotas públicas */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  {/* Rotas protegidas */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/pdv" element={<PDVRedirect />} />
                    <Route path="/pdv-mobile" element={<PDVMobile />} />
                    <Route path="/kds" element={<KDS />} />
                    <Route path="/stock" element={<Stock />} />
                    <Route path="/cashier" element={<Cashier />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </OrderProvider>
            </ProductProvider>
          </StockProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
