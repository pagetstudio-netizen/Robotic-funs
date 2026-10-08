import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, MessagesSquare, Power, type LucideIcon } from "lucide-react";
import accountCardArt from "@assets/file_0000000060b081f5b0594d312204e2bc_1791383580790.png";
import depositIcon from "@assets/Rechange_(1)_1791383388650.png";
import withdrawalIcon from "@assets/Withdraw_(1)_1791383388618.png";
import passwordIcon from "@assets/item2_1791383388379.png";
import bankAccountIcon from "@assets/item3_1791383388468.png";
import historyIcon from "@assets/item4_1791383388497.png";
import aboutIcon from "@assets/item6_1791383388543.png";
import giftCodeIcon from "@assets/item7_1791383388518.png";
import downloadIcon from "@assets/item8_1791383388572.png";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ADMIN_PATH } from "@/lib/admin-path";
import { ROBOTICSFUND_LOGO } from "@/lib/john-deere-assets";
import GiftCodeModal from "@/components/gift-code-modal";
import "./account.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface AccountMenuItem {
  label: string;
  lines: string[];
  image?: string;
  Icon?: LucideIcon;
  onSelect: () => void;
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showGiftCodeModal, setShowGiftCodeModal] = useState(
    () => new URLSearchParams(window.location.search).get("giftCode") === "open",
  );
  const [adminPin, setAdminPin] = useState("");

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiRequest("POST", "/api/admin/verify-pin", { pin });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Code PIN incorrect");
      }
      return response.json();
    },
    onSuccess: () => {
      setShowPinModal(false);
      setAdminPin("");
      navigate(ADMIN_PATH);
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  if (!user) return null;

  const formatFcfa = (value: string | number | null | undefined) => {
    const amount = Number(value || 0);
    return `${Math.round(Number.isFinite(amount) ? amount : 0).toLocaleString("fr-FR")} FCFA`;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAdminClick = () => {
    if (user.isAdminPasswordRequired === false) {
      navigate(ADMIN_PATH);
      return;
    }
    setShowPinModal(true);
  };

  const handleInstall = async () => {
    const installPrompt = (window as Window & {
      _installPrompt?: BeforeInstallPromptEvent | null;
    })._installPrompt;
    if (!installPrompt) {
      toast({
        title: "Téléchargement indisponible",
        description: "Ouvrez ce site dans un navigateur compatible pour l’installer.",
      });
      return;
    }
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      toast({
        title: "Installation non disponible",
        description: "Vous pourrez réessayer depuis le menu de votre navigateur.",
      });
    } finally {
      (window as Window & { _installPrompt?: BeforeInstallPromptEvent | null })._installPrompt = null;
    }
  };

  const handleGiftCodeModalChange = (open: boolean) => {
    setShowGiftCodeModal(open);
    if (!open && new URLSearchParams(window.location.search).get("giftCode") === "open") {
      navigate("/account", { replace: true });
    }
  };

  const menuItems: AccountMenuItem[] = [
    {
      label: "Changer le mot de passe",
      lines: ["Changer", "le mot de", "passe"],
      image: passwordIcon,
      onSelect: () => navigate("/change-password"),
    },
    {
      label: "Ma carte bancaire",
      lines: ["Ma", "carte bancaire"],
      image: bankAccountIcon,
      onSelect: () => navigate("/wallet"),
    },
    {
      label: "Relevé de solde",
      lines: ["Relevé de solde"],
      image: historyIcon,
      onSelect: () => navigate("/history"),
    },
    {
      label: "Contactez-nous",
      lines: ["Contactez", "-nous"],
      Icon: MessagesSquare,
      onSelect: () => navigate("/service"),
    },
    {
      label: "À propos de nous",
      lines: ["À propos", "de nous"],
      image: aboutIcon,
      onSelect: () => navigate("/about"),
    },
    {
      label: "Trésor",
      lines: ["Trésor"],
      image: giftCodeIcon,
      onSelect: () => navigate("/gift-code"),
    },
    {
      label: "Télécharger l'application",
      lines: ["Télécharger", "l'application"],
      image: downloadIcon,
      onSelect: () => void handleInstall(),
    },
    {
      label: "Se déconnecter",
      lines: ["Se déconnecter"],
      Icon: Power,
      onSelect: () => void handleLogout(),
    },
  ];

  return (
    <main className="account-page">
      <div className="account-shell">
        <section className="account-stage" aria-label="Mon compte">
          <div className="account-card">
            <img className="account-card-art" src={accountCardArt} alt="" aria-hidden="true" />
            <div className="account-card-shade" aria-hidden="true" />
            <div className="account-card-content">
              <div className="account-balance-pill">
                <span className="account-phone">{user.phone}</span>
                <span className="account-balance">Solde de retrait : {formatFcfa(user.withdrawalBalance)}</span>
                <span className="account-balance">Solde de dépôt : {formatFcfa(user.depositBalance)}</span>
              </div>
              <div className="account-shortcuts" aria-label="Opérations du compte">
                <button type="button" onClick={() => navigate("/deposit")}>
                  <img src={depositIcon} alt="" aria-hidden="true" />
                  <span>Recharger</span>
                </button>
                <button type="button" onClick={() => navigate("/withdrawal")}>
                  <img src={withdrawalIcon} alt="" aria-hidden="true" />
                  <span>Retirer</span>
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            className={`account-brand-mark${user.isAdmin ? " is-admin-access" : ""}`}
            onClick={user.isAdmin ? handleAdminClick : undefined}
            aria-label={user.isAdmin ? "Accès administrateur" : "RoboticsFund"}
            tabIndex={user.isAdmin ? 0 : -1}
          >
            <img src={ROBOTICSFUND_LOGO} alt="" />
          </button>
        </section>

        <nav className="account-menu" aria-label="Services du compte">
          <div className="account-menu-grid">
            {menuItems.map(({ label, lines, image, Icon, onSelect }) => (
              <button
                key={label}
                type="button"
                className="account-menu-item"
                onClick={onSelect}
                aria-label={label}
              >
                <span
                  className={`account-menu-icon${Icon === MessagesSquare ? " is-contact" : ""}${Icon === Power ? " is-power" : ""}`}
                  aria-hidden="true"
                >
                  {image ? <img src={image} alt="" /> : Icon ? <Icon /> : null}
                </span>
                <span className="account-menu-label">
                  {lines.map((line) => <span key={line}>{line}</span>)}
                </span>
              </button>
            ))}
          </div>
          <div className="account-menu-divider" aria-hidden="true" />
        </nav>
      </div>

      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Code d'accès administrateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Entrez votre code PIN pour accéder au panel administrateur
            </p>
            <Input
              type="password"
              value={adminPin}
              onChange={(event) => setAdminPin(event.target.value)}
              placeholder="Code PIN"
              className="text-center text-2xl tracking-widest"
              maxLength={8}
              data-testid="input-admin-pin"
            />
            <Button
              onClick={() => {
                if (adminPin.length < 4) {
                  toast({
                    title: "Le code PIN doit contenir au moins 4 caractères",
                    variant: "destructive",
                  });
                  return;
                }
                verifyPinMutation.mutate(adminPin);
              }}
              disabled={verifyPinMutation.isPending || adminPin.length < 4}
              className="w-full bg-[#367c2b] hover:bg-[#285f20]"
              data-testid="button-verify-pin"
            >
              {verifyPinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GiftCodeModal open={showGiftCodeModal} onOpenChange={handleGiftCodeModalChange} />
    </main>
  );
}
