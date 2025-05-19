
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "@/types/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar o perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Erro ao processar perfil:", error);
      return null;
    }
  };

  // Função para limpar o estado de autenticação
  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    
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

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Configurar o listener para mudanças de estado de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log("Auth state changed:", event);
            setUser(currentSession?.user ?? null);
            setSession(currentSession);
            
            // Buscar o perfil do usuário quando autenticado
            if (currentSession?.user) {
              setTimeout(async () => {
                const userProfile = await fetchProfile(currentSession.user.id);
                setProfile(userProfile);
              }, 0);
            } else {
              setProfile(null);
            }
          }
        );
        
        // Verificar se já existe uma sessão
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setUser(currentSession?.user ?? null);
        setSession(currentSession);
        
        // Buscar o perfil se existir um usuário
        if (currentSession?.user) {
          const userProfile = await fetchProfile(currentSession.user.id);
          setProfile(userProfile);
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Erro na inicialização da autenticação:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Limpar estado de autenticação
      cleanupAuthState();
      
      // Deslogar do Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast.success("Desconectado com sucesso");
      
      // Redirecionar para a página de login com refresh
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      toast.error("Erro ao desconectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
}
