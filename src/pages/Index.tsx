
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (session) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }
  }, [navigate, session, loading]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Carregando FoodPOS...</h1>
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
};

export default Index;
