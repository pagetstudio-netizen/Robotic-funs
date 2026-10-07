import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import giftBoxImage from "@assets/—Pngtree—vector_gift_icon_3988959_1787388071591.png";
import "./gift-code-modal.css";

interface GiftCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "default" | "treasure";
  onClaimSuccess?: (message?: string) => void;
}

interface PlatformSettings {
  groupLink?: string;
}

interface ClaimResponse {
  message?: string;
}

export default function GiftCodeModal({
  open,
  onOpenChange,
  variant = "default",
  onClaimSuccess,
}: GiftCodeModalProps) {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { data: settings, isLoading: settingsLoading } = useQuery<PlatformSettings>({
    queryKey: ["/api/settings"],
    enabled: open && variant === "default",
  });

  const claimMutation = useMutation({
    mutationFn: async (giftCode: string): Promise<ClaimResponse> => {
      const response = await apiRequest("POST", "/api/gift-codes/claim", { code: giftCode });
      return response.json();
    },
    onSuccess: async (data) => {
      await refreshUser();
      setCode("");
      if (variant === "treasure") {
        onClaimSuccess?.(data.message);
        onOpenChange(false);
        return;
      }
      setSuccessMessage(data.message || "Votre code cadeau a été réclamé avec succès.");
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const groupLink = settings?.groupLink?.trim();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCode("");
      setSuccessMessage("");
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      toast({ title: "Erreur", description: "Veuillez saisir un code", variant: "destructive" });
      return;
    }
    claimMutation.mutate(normalizedCode);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`gift-code-dialog${variant === "treasure" ? " gift-code-dialog--treasure" : ""}`}
        data-testid="dialog-gift-code"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {variant === "treasure" ? (
          <>
            <DialogTitle className="gift-code-modal-title">
              Veuillez saisir la clé secrète
            </DialogTitle>
            <form className="gift-code-treasure-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="gift-code-treasure-input">
                Clé secrète
              </label>
              <input
                id="gift-code-treasure-input"
                className="gift-code-modal-input gift-code-treasure-input"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                autoComplete="off"
                data-testid="input-gift-code"
              />
              <div className="gift-code-treasure-footer">
                <button
                  className="gift-code-treasure-cancel"
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  data-testid="button-cancel-gift-code"
                >
                  Annuler
                </button>
                <button
                  className="gift-code-treasure-confirm"
                  type="submit"
                  disabled={claimMutation.isPending}
                  data-testid="button-submit-code"
                >
                  {claimMutation.isPending
                    ? <Loader2 className="gift-code-modal-spinner" aria-label="Vérification en cours" />
                    : "D'ACCORD"}
                </button>
              </div>
            </form>
          </>
        ) : successMessage ? (
          <div className="gift-code-modal-success" role="status" aria-live="polite">
            <CheckCircle2 className="gift-code-modal-success-icon" aria-hidden="true" />
            <DialogTitle className="gift-code-modal-title">Code cadeau obtenu !</DialogTitle>
            <p className="gift-code-modal-success-message">{successMessage}</p>
            <button
              className="gift-code-modal-submit"
              type="button"
              onClick={() => handleOpenChange(false)}
              data-testid="button-close-gift-success"
            >
              Terminer
            </button>
          </div>
        ) : (
          <>
            <img className="gift-code-modal-art" src={giftBoxImage} alt="" aria-hidden="true" />
            <DialogTitle className="gift-code-modal-title">Échanger des cadeaux</DialogTitle>

            <form className="gift-code-modal-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="gift-code-modal-input">Code cadeau</label>
              <input
                id="gift-code-modal-input"
                className="gift-code-modal-input"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Saisir le code cadeau"
                autoComplete="off"
                data-testid="input-gift-code"
              />
              <button
                className="gift-code-modal-submit"
                type="submit"
                disabled={claimMutation.isPending}
                data-testid="button-submit-code"
              >
                {claimMutation.isPending
                  ? <Loader2 className="gift-code-modal-spinner" aria-label="Réclamation en cours" />
                  : "Réclamer"}
              </button>
            </form>

            <a
              className={`gift-code-modal-link${groupLink ? "" : " is-unavailable"}`}
              href={groupLink || undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!groupLink}
              onClick={(event) => {
                if (!groupLink) {
                  event.preventDefault();
                  if (!settingsLoading) {
                    toast({
                      title: "Lien Telegram indisponible",
                      description: "Le groupe Telegram n’est pas configuré.",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              Obtenir un code d’échange.
            </a>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}