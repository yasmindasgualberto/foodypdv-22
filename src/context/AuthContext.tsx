
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Profile, Session } from "@/types/supabase";

type AuthContextType = {
  session: Session | null;
  user: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const setData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setSession(session as unknown as Session);
        
        // Carregar o perfil do usuário
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        setUser(profile);
      }
      
      setLoading(false);
    };

    setData();

    // Escutar mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session as unknown as Session);
        
        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          setUser(profile);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Limpar estado de autenticação anterior
      cleanupAuthState();
      
      // Tentar fazer logout global para garantir um estado limpo
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuar mesmo se falhar
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Redirecionar para o dashboard
      navigate("/dashboard");
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      setLoading(true);
      
      // Limpar estado de autenticação anterior
      cleanupAuthState();
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
          },
        },
      });

      if (error) throw error;
      
      toast({
        title: "Conta criada com sucesso",
        description: "Bem-vindo ao FoodPOS!",
      });
      
      // Redirecionar para o dashboard
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Verifique seus dados e tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Limpar estado de autenticação
      cleanupAuthState();
      
      // Fazer logout global
      await supabase.auth.signOut({ scope: 'global' });
      
      // Redirecionar para a página de login
      navigate("/login");
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Até breve!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
