
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Função para limpar o estado de autenticação
  const cleanupAuthState = () => {
    // Remover tokens de autenticação padrão
    localStorage.removeItem('supabase.auth.token');
    
    // Remover todas as chaves de autenticação Supabase do localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remover do sessionStorage se estiver em uso
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });

    // Remover dados de produto, estoque e pedidos do localStorage
    localStorage.removeItem('products');
    localStorage.removeItem('stockItems');
    localStorage.removeItem('orders');
    localStorage.removeItem('shifts');
    localStorage.removeItem('generalSettings');
    localStorage.removeItem('appearanceSettings');
    localStorage.removeItem('printerSettings');
    localStorage.removeItem('integrationSettings');
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro na requisição de perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    // Configurar o ouvinte de alterações de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Usar setTimeout para evitar deadlocks
          setTimeout(async () => {
            const profileData = await fetchProfile(currentSession.user.id);
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Verificar sessão existente
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Limpar estado de autenticação primeiro
      cleanupAuthState();
      
      // Tentar deslogar globalmente
      await supabase.auth.signOut({ scope: 'global' });
      
      // Atualizar estado
      setSession(null);
      setUser(null);
      setProfile(null);
      
      toast.success("Logout realizado com sucesso");
      
      // Redirecionar para login
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error(`Erro ao fazer logout: ${error.message}`);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
