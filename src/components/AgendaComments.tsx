import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAgendaCommentsByAgenda, useInsertAgendaComment, useDeleteAgendaComment } from "@/hooks/useDatabase";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AgendaCommentsProps {
  agendaIds: string[];
}

export function AgendaComments({ agendaIds }: AgendaCommentsProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [comment, setComment] = useState("");
  const { data: comments = [], isLoading } = useAgendaCommentsByAgenda(agendaIds);
  const insertComment = useInsertAgendaComment();
  const deleteComment = useDeleteAgendaComment();

  const handleSubmit = async () => {
    if (!comment.trim() || !user || agendaIds.length === 0) return;
    try {
      await insertComment.mutateAsync({
        agenda_id: agendaIds[0],
        reviewer_cc: user.id,
        comment: comment.trim(),
      });
      setComment("");
      toast.success("Comentario agregado");
    } catch {
      toast.error("Error al agregar comentario");
    }
  };

  return (
    <div className="border-t pt-3 px-4 pb-3 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />
        {t("comments.title")}
      </h3>

      <ScrollArea className="max-h-40">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t("comments.empty")}</p>
        ) : (
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="text-xs bg-accent/30 rounded p-2 group relative">
                <p className="text-foreground whitespace-pre-wrap">{c.comment}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">
                    {t("comments.by")} {c.reviewer_cc} · {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  {user?.id === c.reviewer_cc && (
                    <button
                      className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteComment.mutate(c.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {user && (
        <div className="flex gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("comments.placeholder")}
            className="min-h-[60px] text-xs resize-none"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!comment.trim() || insertComment.isPending}
            className="shrink-0 self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
