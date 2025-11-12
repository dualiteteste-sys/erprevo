import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import type { Session, User, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Empresa } from '@/services/company';
import { bootstrapEmpresaParaUsuarioAtual } from '@/services/session';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  empresas: Empresa[];
  activeEmpresa: Empresa | null;
  signOut: () => Promise<void>;
  signInWithPassword: (credentials: SignInWithPasswordCredentials) => Promise<void>;
  refreshEmpresas: () => Promise<void>;
  setActiveEmpresa: (empresa: Empresa) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [activeEmpresa, setActiveEmpresaState] = useState<Empresa | null>(null);

  const bootOnceRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchSession = async () => {
      console.log('[AUTH] getSession:init');
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) console.error('[AUTH][getSession][ERR]', error);

      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
      console.log('[AUTH] getSession:done', { hasSession: !!data?.session });
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('[AUTH] onAuthStateChange', { event: _event, hasSession: !!newSession });
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const refreshEmpresas = useCallback(async () => {
    if (!supabase) return;
    const currentUser = session?.user;
    if (!currentUser) return;
  
    try {
      const { data: userEmpresas, error: userEmpresasError } = await supabase
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', currentUser.id);
  
      if (userEmpresasError) throw userEmpresasError;
  
      const empresaIds = userEmpresas.map(ue => ue.empresa_id);
  
      if (empresaIds.length === 0) {
        setEmpresas([]);
        setActiveEmpresaState(null);
        return;
      }
  
      const { data: empresasList, error: empresasError } = await supabase
        .from('empresas')
        .select('*')
        .in('id', empresaIds);
  
      if (empresasError) throw empresasError;
      setEmpresas(empresasList ?? []);
  
      const { data: activeEmpresaLink, error: activeError } = await supabase
        .from('user_active_empresa')
        .select('empresa_id')
        .eq('user_id', currentUser.id)
        .single();
  
      if (activeError && activeError.code !== 'PGRST116') {
        throw activeError;
      }
  
      if (activeEmpresaLink) {
        const active = empresasList?.find(e => e.id === activeEmpresaLink.empresa_id) ?? null;
        setActiveEmpresaState(active);
      } else if (empresasList && empresasList.length > 0) {
        setActiveEmpresaState(empresasList[0]);
        await supabase.from('user_active_empresa').upsert({ user_id: currentUser.id, empresa_id: empresasList[0].id });
      } else {
        setActiveEmpresaState(null);
      }
    } catch (e) {
      console.warn('[AUTH][EMPRESAS][WARN]', e);
      setEmpresas([]);
      setActiveEmpresaState(null);
    }
  }, [session, supabase]);

  useEffect(() => {
    if (session && !bootOnceRef.current) {
      bootOnceRef.current = true;
      (async () => {
        try {
          console.log('[AUTH] bootstrapEmpresaParaUsuarioAtual:start');
          await bootstrapEmpresaParaUsuarioAtual();
        } catch (e) {
          console.warn('[AUTH][BOOTSTRAP][WARN]', e);
        } finally {
          await refreshEmpresas();
          console.log('[AUTH] bootstrapEmpresaParaUsuarioAtual:done');
        }
      })();
    } else if (session) {
        refreshEmpresas();
    } else if (!session && !loading) {
        // Clear company data on sign out
        setEmpresas([]);
        setActiveEmpresaState(null);
        bootOnceRef.current = false;
    }
  }, [session, loading, refreshEmpresas]);

  const setActiveEmpresa = useCallback(async (empresa: Empresa) => {
    if (!supabase) return;
    const currentUser = session?.user;
    if (!currentUser) return;
    const { error } = await supabase
      .from('user_active_empresa')
      .upsert({ user_id: currentUser.id, empresa_id: empresa.id }, { onConflict: 'user_id' });

    if (error) {
      console.error('[AUTH][SET_ACTIVE_EMPRESA][ERR]', error);
    } else {
      setActiveEmpresaState(empresa);
    }
  }, [session, supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    console.log('[AUTH] signOut');
    await supabase.auth.signOut();
  }, [supabase]);

  const signInWithPassword = useCallback(async (credentials: SignInWithPasswordCredentials) => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
  }, [supabase]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      empresas,
      activeEmpresa,
      signOut,
      signInWithPassword,
      refreshEmpresas,
      setActiveEmpresa,
    }),
    [user, session, loading, empresas, activeEmpresa, signOut, signInWithPassword, refreshEmpresas, setActiveEmpresa],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
