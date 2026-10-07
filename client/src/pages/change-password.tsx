import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur lors du changement de mot de passe");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Mot de passe modifié avec succès" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/account");
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Mot de passe trop court", description: "Minimum 6 caractères requis", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les nouveaux mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <main className="min-h-[100dvh] w-full bg-white">
      <div
        className="mx-auto min-h-[100dvh] w-full max-w-[432px] bg-white text-[#282832]"
        style={{ fontFamily: "Roboto, Arial, sans-serif", containerType: "inline-size" }}
      >
        <header className="sticky top-0 z-50 flex h-[48px] items-center bg-[#23242f] px-4 text-white">
          <button
            type="button"
            onClick={() => navigate("/account")}
            className="flex items-center gap-0.5 text-white"
            data-testid="button-back"
          >
            <ChevronLeft className="h-[22px] w-4" strokeWidth={1.8} />
            <span className="text-[14px] font-normal">Dos</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[clamp(16px,4.5cqw,20px)] font-normal leading-none">
            Changer le mot de passe
          </h1>
        </header>

        <section aria-label="Modification du mot de passe">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Ancien mot de pas..."
            aria-label="Ancien mot de passe"
            className="block h-[48px] w-full border-b border-[#e1e1e4] bg-white px-4 text-[16px] font-normal text-[#33333b] outline-none placeholder:text-[#38383e] focus:border-b-[#e1e1e4]"
            data-testid="input-current-password"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de p..."
            aria-label="Nouveau mot de passe"
            className="block h-[50px] w-full border-b border-[#e1e1e4] bg-white px-4 text-[16px] font-normal text-[#33333b] outline-none placeholder:text-[#38383e] focus:border-b-[#e1e1e4]"
            data-testid="input-new-password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Entrez à nouveau l..."
            aria-label="Confirmer le nouveau mot de passe"
            className="block h-[49px] w-full border-b border-[#e1e1e4] bg-white px-4 text-[16px] font-normal text-[#33333b] outline-none placeholder:text-[#38383e] focus:border-b-[#e1e1e4]"
            data-testid="input-confirm-password"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={changePasswordMutation.isPending}
            className="mx-auto mt-[18.5px] flex h-[44.5px] w-[calc(100%-51px)] items-center justify-center rounded-[10px] bg-[#23242f] text-[16px] font-normal text-white disabled:opacity-60"
            data-testid="button-change-password-submit"
          >
            {changePasswordMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Modification...
              </span>
            ) : (
              "Sauvegarder"
            )}
          </button>
        </section>
      </div>
    </main>
  );
}
