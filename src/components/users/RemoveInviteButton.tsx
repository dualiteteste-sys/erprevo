import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Trash2 } from "lucide-react";

type Props = {
  userId: string;
  status: string;
  onRemoved?: (userId: string) => void;
};

export default function RemoveInviteButton({ userId, status, onRemoved }: Props) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (loading || status !== "PENDING") return;

    setLoading(true);
    try {
      console.log("[RPC][DELETE_INVITE] start", { userId });

      const { data, error } = await supabase.rpc<number>("delete_pending_invitation", {
        p_user_id: userId,
      });

      if (error) {
        console.error("[RPC][DELETE_INVITE] error", error);
        alert("Não foi possível remover o convite.");
        return;
      }

      const deletedCount = typeof data === "number" ? data : 0;
      console.log("[RPC][DELETE_INVITE] result", { deletedCount });

      if (deletedCount < 1) {
        alert("Convite não pôde ser removido (verifique permissões/status).");
        return;
      }

      onRemoved?.(userId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || status !== "PENDING"}
      className="flex items-center gap-1.5 text-xs px-2 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title={status === "PENDING" ? "Remover convite" : "Somente convites pendentes podem ser removidos"}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      {loading ? "Removendo..." : "Remover"}
    </button>
  );
}
