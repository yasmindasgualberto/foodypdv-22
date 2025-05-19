
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
