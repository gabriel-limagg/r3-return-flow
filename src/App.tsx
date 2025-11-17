import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import Login from "./pages/Login";
import Pedidos from "./pages/Pedidos";
import CadastroPedido from "./pages/CadastroPedido";
import EditarPedido from "./pages/EditarPedido";
import ImportarPedidos from "./pages/ImportarPedidos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/pedidos" replace />} />
            <Route
              path="/pedidos"
              element={
                <ProtectedRoute>
                  <Pedidos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cadastro"
              element={
                <ProtectedRoute>
                  <CadastroPedido />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pedidos/:id/editar"
              element={
                <ProtectedRoute>
                  <EditarPedido />
                </ProtectedRoute>
              }
            />
            <Route
              path="/importar"
              element={
                <ProtectedRoute>
                  <ImportarPedidos />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
