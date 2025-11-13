import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

function parseHashTokens(): { access_token?: string; refresh_token?: string } | null {
  const h = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!h) return null;
  const p = new URLSearchParams(h);
  const access_token = p.get("access_token") || undefined;
  const refresh_token = p.get("refresh_token") || undefined;
  if (access_token && refresh_token) return { access_token, refresh_token };
  return null;
}

export default function CallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [msg, setMsg] = useState("Processando login…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const s0 = await supabase.auth.getSession();
        if (s0.data.session) {
          if (!cancelled) {
            setMsg("Sessão criada. Redirecionando…");
            navigate("/auth/set-password", { replace: true });
          }
          return;
        }

        const code = params.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session && !cancelled) {
            setMsg("Sessão criada. Redirecionando…");
            navigate("/auth/set-password", { replace: true });
            return;
          }
        }

        const legacy = parseHashTokens();
        if (legacy?.access_token && legacy?.refresh_token) {
          const { data, error } = await supabase.auth.setSession(legacy);
          if (!error && data?.session && !cancelled) {
            setMsg("Sessão criada. Redirecionando…");
            navigate("/auth/set-password", { replace: true });
            return;
          }
        }

        if (!cancelled) {
          setMsg("Falha ao autenticar. Redirecionando…");
          setTimeout(() => navigate("/auth/set-password", { replace: true }), 700);
        }
      } catch (e: any) {
        console.error("[AUTH][CALLBACK] error", e);
        if (!cancelled) {
          setMsg("Falha ao autenticar. Redirecionando…");
          setTimeout(() => navigate("/auth/set-password", { replace: true }), 700);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, params]);

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-md w-full rounded-2xl shadow-lg p-6 backdrop-blur bg-white/5 text-gray-800">
        <h1 className="text-xl font-semibold mb-2">Entrando…</h1>
        <p className="opacity-80">{msg}</p>
      </div>
    </div>
  );
}
