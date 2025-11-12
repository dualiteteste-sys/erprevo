import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { listUsersV2, inviteUser, TenantUser } from "@/services/users";
import { Button } from "@/components/ui/button";
import RemoveInviteButton from "@/components/users/RemoveInviteButton";
import ResendInviteButton from "@/components/users/ResendInviteButton";
import { useToast } from "@/contexts/ToastProvider";

const ROLE_OPTIONS = ["ADMIN", "OWNER"] as const;
const DEFAULT_ROLE = "ADMIN";

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<TenantUser[]>([]);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState<string>(DEFAULT_ROLE);
  const [inviting, setInviting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) {
        setError("Sessão inválida. Faça login.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("has_permission_for_current_user", {
        p_module: "usuarios",
        p_action: "manage",
      });
      if (error) {
        console.error("[RPC] has_permission_for_current_user", error);
        setError("Falha ao validar permissão.");
        setLoading(false);
        return;
      }
      setAllowed(!!data);

      if (data) await doRefresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doRefresh() {
    try {
      setRefreshing(true);
      const data = await listUsersV2({ limit: 50, offset: 0, q: null, status: null, roles: null });
      setRows(data);
    } catch (e: any) {
      console.error("[RPC] list users v2 failed", e);
      setError("Falha ao carregar usuários.");
    } finally {
      setRefreshing(false);
    }
  }

  const canInvite = useMemo(() => allowed, [allowed]);

  async function onInvite() {
    setMessage(null);
    const email = invEmail.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      setMessage("Informe um e-mail válido.");
      return;
    }
    if (!ROLE_OPTIONS.includes(invRole as any)) {
      console.warn("[FORM] role inválido no front; usando DEFAULT_ROLE");
      setInvRole(DEFAULT_ROLE);
    }

    try {
      setInviting(true);
      const res = await inviteUser({ email, role: invRole });
      // Esperado: { ok: true, action: "invited" | "linked", data: { status: "PENDING" | "ACTIVE" } }
      setMessage(res?.ok ? `Convite: ${res.action} (${res?.data?.status ?? "—"})` : "Convite enviado.");
      setInvEmail("");
      await doRefresh();
    } catch (e: any) {
      console.error("[INVITE] error", e);
      setMessage("Não foi possível enviar o convite.");
    } finally {
      setInviting(false);
    }
  }

  if (loading) return <div className="p-6">Carregando…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!allowed) return <div className="p-6">Sem permissão para gerenciar usuários.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Usuários da Empresa</h1>
        <div className="flex items-center gap-2">
          <input
            type="email"
            placeholder="email@empresa.com"
            value={invEmail}
            onChange={(e) => setInvEmail(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          />
          <select
            value={invRole}
            onChange={(e) => setInvRole(e.target.value)}
            className="border rounded-md px-2 py-2 text-sm"
            aria-label="Role"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <Button onClick={onInvite} disabled={inviting || !canInvite}>
            {inviting ? "Enviando…" : "Convidar"}
          </Button>
          <Button variant="outline" onClick={doRefresh} disabled={refreshing}>
            {refreshing ? "Atualizando…" : "Atualizar"}
          </Button>
        </div>
      </div>

      {message && <div className="text-sm">{message}</div>}

      <div className="border rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Papel</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Entrou em</th>
              <th className="text-left px-4 py-2">Último acesso</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t">
                <td className="px-4 py-2">{r.email ?? "—"}</td>
                <td className="px-4 py-2">{r.name ?? "—"}</td>
                <td className="px-4 py-2">{r.role ?? "—"}</td>
                <td className="px-4 py-2">{r.status ?? "—"}</td>
                <td className="px-4 py-2">{fmt(r.invited_at)}</td>
                <td className="px-4 py-2">{fmt(r.last_sign_in_at)}</td>
                <td className="px-4 py-2 text-right">
                  {r.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2">
                      <ResendInviteButton
                        userId={r.user_id}
                        status={r.status}
                        onResent={() => {
                          addToast(`Convite para ${r.email} reenviado.`, 'info');
                        }}
                      />
                      <RemoveInviteButton
                        userId={r.user_id}
                        status={r.status}
                        onRemoved={(id) => {
                          setRows((prev) => prev.filter((user) => user.user_id !== id));
                        }}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground text-center" colSpan={7}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Dica: convites para e-mails novos aparecem com status <b>PENDING</b> até a confirmação.
      </p>
    </div>
  );
}

function fmt(v?: string | null) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString('pt-BR');
  } catch {
    return "—";
  }
}
