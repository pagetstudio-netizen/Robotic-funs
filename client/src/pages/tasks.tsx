import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { Task } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/empty-state";
import invitationRobot from "@assets/robot_(1)_1791383070829.png";
import "./tasks.css";

interface TaskWithStatus extends Task {
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

type CopyKind = "code" | "link";

const tierStyles = [
  "tier-peach",
  "tier-yellow",
  "tier-orange",
  "tier-coral",
  "tier-red",
  "tier-crimson",
  "tier-crimson",
];

function formatFcfa(amount: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
}

export default function TasksPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState<CopyKind | null>(null);

  const { data: tasks, isLoading, isError, refetch } = useQuery<TaskWithStatus[]>({
    queryKey: ["/api/tasks"],
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/claim`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Impossible de réclamer cette récompense.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refreshUser();
      toast({ title: "Récompense réclamée", description: "Le montant a été ajouté à votre compte." });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const invitationLink = useMemo(() => {
    if (!user?.referralCode || typeof window === "undefined") return "";
    return `${window.location.origin}/register?code=${encodeURIComponent(user.referralCode)}`;
  }, [user?.referralCode]);

  if (!user) return null;

  const copyInvitationValue = async (value: string, kind: CopyKind) => {
    try {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
        await navigator.clipboard.writeText(value);
      } catch {
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const copiedSuccessfully = document.execCommand("copy");
        field.remove();
        if (!copiedSuccessfully) throw new Error("Copy failed");
      }

      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1300);
    } catch {
      toast({
        title: "Copie impossible",
        description: "Veuillez sélectionner et copier le texte manuellement.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="invite-reference-preview invite-page">
      <div className="invite-reference-scroll">
        <header className="invite-reference-header">
          <h1>Récompenses d&apos;invitation</h1>
          <img className="invite-reference-hero-robot" src={invitationRobot} alt="" aria-hidden="true" />

          <section className="invite-reference-code-panel" aria-label="Informations d'invitation">
            <div className="invite-reference-code-row">
              <div className="invite-reference-code-copy">
                <span className="invite-reference-label">Code d&apos;invitation</span>
                <strong>{user.referralCode}</strong>
              </div>
              <button
                className="invite-reference-copy-button"
                type="button"
                onClick={() => void copyInvitationValue(user.referralCode, "code")}
                aria-label="Copier le code d'invitation"
              >
                {copied === "code" ? "Copié" : "Copie"}
              </button>
            </div>
            <div className="invite-reference-code-row invite-reference-link-row">
              <div className="invite-reference-code-copy">
                <span className="invite-reference-label">Copier le lien</span>
                <strong className="invite-reference-url">{invitationLink || "Lien indisponible"}</strong>
              </div>
              <button
                className="invite-reference-copy-button"
                type="button"
                onClick={() => invitationLink && void copyInvitationValue(invitationLink, "link")}
                disabled={!invitationLink}
                aria-label="Copier le lien d'invitation"
              >
                {copied === "link" ? "Copié" : "Copie"}
              </button>
            </div>
          </section>
        </header>

        <section className="invite-reference-tiers" aria-label="Paliers de récompense">
          {isLoading ? (
            <div className="invite-reference-loading" role="status">
              <Loader2 aria-hidden="true" />
              <span>Chargement...</span>
            </div>
          ) : isError ? (
            <div className="invite-reference-error" role="alert">
              <span>Impossible de charger les tâches d&apos;invitation.</span>
              <button type="button" onClick={() => void refetch()}>Réessayer</button>
            </div>
          ) : tasks && tasks.length > 0 ? (
            tasks.map((task, index) => {
              const statusLabel = task.isCompleted
                ? "Terminé"
                : task.canClaim
                  ? "Réclamer"
                  : "Inachevé";
              const taskClass = tierStyles[index] ?? tierStyles[tierStyles.length - 1];

              return (
                <article className={`invite-reference-tier ${taskClass}`} key={task.id} data-testid={`task-item-${task.id}`}>
                  <img className="invite-reference-watermark" src={invitationRobot} alt="" aria-hidden="true" />
                  <div className="invite-reference-tier-content">
                    <strong className="invite-reference-reward">{formatFcfa(task.reward)}</strong>
                    <h2>Tâche d&apos;invitation</h2>
                    <p>Invitez {task.requiredInvites} membres de niveau 1 à investir</p>
                    {task.canClaim && !task.isCompleted ? (
                      <button
                        className="invite-reference-status invite-reference-claim-button"
                        type="button"
                        onClick={() => claimMutation.mutate(task.id)}
                        disabled={claimMutation.isPending}
                        data-testid={`button-claim-${task.id}`}
                      >
                        {claimMutation.isPending ? <Loader2 className="invite-claim-spinner" aria-label="Réclamation en cours" /> : statusLabel}
                      </button>
                    ) : (
                      <span className={`invite-reference-status ${task.isCompleted ? "is-completed" : ""}`}>
                        {statusLabel}
                      </span>
                    )}
                    <span className="invite-reference-progress">
                      Progression : {task.currentInvites}/{task.requiredInvites}
                    </span>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState className="invite-reference-empty">
              <p>Aucune tâche d&apos;invitation disponible.</p>
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
