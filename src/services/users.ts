// src/services/users.ts
// Serviços de Usuários: listar (RPC), convidar e reenviar convites (Edge Functions)
// Logs temporários: [USERS] [INVITE] [RESEND]

import { supabase } from "@/lib/supabaseClient";

/** Shape usado na UsersPage (mantém campos legados para compatibilidade) */
export type ListedUser = {
  user_id: string;
  email?: string | null;
  full_name?: string | null; // compat (não usamos)
  status: string;
  role_id?: string | null;   // compat (RPC retorna role_slug)
  role_slug?: string | null;
};

/* ============================================================================
 * LISTAGEM
 * Usa a RPC segura `public.list_users_for_current_empresa()`:
 * - Filtra por tenant atual (usa current_empresa_id() no server)
 * - Lê email direto de auth.users (não depende de profiles.email/full_name)
 * - Suporta busca por email (p_search)
 * ========================================================================== */
export async function listUsersV2(params?: { search?: string }): Promise<ListedUser[]> {
  const p_search = params?.search?.trim() || null;

  const { data, error } = await supabase.rpc("list_users_for_current_empresa", { p_search });

  if (error) {
    console.error("[USERS] rpc list_users_for_current_empresa error", error);
    throw new Error("Falha ao listar usuários.");
  }

  return (data ?? []).map((row: any) => ({
    user_id: row.user_id,
    email: row.email ?? null,
    full_name: null,         // não há full_name no schema atual
    status: row.status,
    role_id: null,           // mantido p/ compat; não retornamos id
    role_slug: row.role_slug ?? null,
  }));
}

/* ============================================================================
 * CONVIDAR USUÁRIO (Edge Function: invite-user)
 * - Envia { email, role?, empresa_id? }
 * - Retorna { ok, action: "invited"|"linked", data: {...} }
 * ========================================================================== */
export async function inviteUser(params: {
  email: string;
  role?: string;
  empresa_id?: string;
}) {
  const { email, role = "ADMIN", empresa_id } = params;

  console.log("[INVITE] invoke invite-user", { email, role, empresa_id });

  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: { email, role, ...(empresa_id ? { empresa_id } : {}) },
  });

  if (error) {
    // Extração resiliente da mensagem de erro
    let detail: string | undefined;
    try {
      const ctx: any = (error as any).context;
      if (ctx && typeof ctx.text === "function") {
        const raw = await ctx.text();
        try {
          const parsed = JSON.parse(raw);
          detail = parsed?.detail || parsed?.error || raw;
        } catch {
          detail = raw;
        }
      }
    } catch {
      /* ignore */
    }
    console.error("[INVITE] error", error, detail);
    throw new Error(detail || (error as any).message || "Falha ao enviar convite.");
  }

  console.log("[INVITE] ok", data);
  return data;
}

/* ============================================================================
 * REENVIAR CONVITE (Edge Function: resend-invite)
 * - Aceita string (user_id) ou objeto { user_id?, email?, empresa_id? }
 * - Retorna { ok, action: "invited"|"resent", data: {...} }
 * ========================================================================== */
export async function resendInvite(
  arg: string | { user_id?: string; email?: string; empresa_id?: string }
) {
  const body =
    typeof arg === "string"
      ? { user_id: arg }
      : {
          ...(arg.user_id ? { user_id: arg.user_id } : {}),
          ...(arg.email ? { email: arg.email } : {}),
          ...(arg.empresa_id ? { empresa_id: arg.empresa_id } : {}),
        };

  console.log("[RESEND] invoke resend-invite", body);

  const { data, error } = await supabase.functions.invoke("resend-invite", { body });

  if (error) {
    console.error("[RESEND] error", error);
    // Extração resiliente do erro
    let detail: string | undefined;
    try {
      const ctx: any = (error as any).context;
      if (ctx && typeof ctx.text === "function") {
        const raw = await ctx.text();
        try {
          const parsed = JSON.parse(raw);
          detail = parsed?.detail || parsed?.error || raw;
        } catch {
          detail = raw;
        }
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail || (error as any).message || "Falha ao reenviar convite.");
  }

  console.log("[RESEND] ok", data);
  return data;
}
