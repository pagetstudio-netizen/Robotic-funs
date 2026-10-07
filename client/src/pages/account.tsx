import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ChevronRight,
  Loader2,
  LogOut,
  Shield,
} from "lucide-react";
import aboutIcon from "@assets/info_(1)_1790682898817.png";
import passwordIcon from "@assets/sign_in_1790682898843.png";
import giftCodeIcon from "@assets/rewards_1790682898867.png";
import supportIcon from "@assets/help_1790682898889.png";
import historyIcon from "@assets/withdraw_record_(1)_1790682898914.png";
import depositIcon from "@assets/a90f54732fab3ff150753cf117ce6a24_1790690575928.png";
import withdrawalIcon from "@assets/fa6620bc07e2128cfd6a47b85bb73129_1790690575968.png";
import bankAccountIcon from "@assets/a96d355bc25b348d27c903a0be9d6798_1790690576005.png";
import balanceIcon from "@assets/téléchargement_(63)_1790690576065.png";
import type { WithdrawalWallet } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { getCountryByCode, type ApiCountry } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ADMIN_PATH } from "@/lib/admin-path";
import { ROBOTICSFUND_LOGO } from "@/lib/john-deere-assets";
import GiftCodeModal from "@/components/gift-code-modal";
import "./account.css";

interface TeamStatsSummary {
  totalCommission: number;
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

  const { data: apiCountries = [] } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });

  const { data: teamStats, isLoading: teamStatsLoading, isError: teamStatsError } =
    useQuery<TeamStatsSummary>({
      queryKey: ["/api/team/stats"],
      enabled: Boolean(user),
    });

  const { data: wallets, isLoading: walletsLoading, isError: walletsError } =
    useQuery<WithdrawalWallet[]>({
      queryKey: ["/api/wallets"],
      enabled: Boolean(user),
    });

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", "/api/admin/verify-pin", { pin });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Code PIN incorrect");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowPinModal(false);
      setAdminPin("");
      navigate(ADMIN_PATH);
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  if (!user) return null;

  const country = getCountryByCode(user.country, apiCountries);
  const currency = country?.currency || "XOF";
  const formatAmount = (value: string | number | null | undefined) => {
    const amount = Number(value || 0);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return `${Math.round(safeAmount).toLocaleString("fr-FR")} ${currency}`;
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

  const handleGiftCodeModalChange = (open: boolean) => {
    setShowGiftCodeModal(open);
    if (!open && new URLSearchParams(window.location.search).get("giftCode") === "open") {
      navigate("/account", { replace: true });
    }
  };

  const accountLinks = [
    { label: "Historique", image: historyIcon, onSelect: () => navigate("/history") },
    { label: "Code cadeau", image: giftCodeIcon, onSelect: () => setShowGiftCodeModal(true) },
    { label: "À propos", image: aboutIcon, onSelect: () => navigate("/about") },
    { label: "Mot de passe", image: passwordIcon, onSelect: () => navigate("/change-password") },
    { label: "Déconnexion", Icon: LogOut, onSelect: () => void handleLogout() },
  ];

  const walletStatus = walletsLoading
    ? "Vérification…"
    : walletsError
      ? "Indisponible"
      : wallets?.length
        ? "Lié"
        : "Non lié";

  return (
    <main className="account-page">
      <div className="account-shell">
        <header className="account-header">
          <div className="account-profile">
            <div className="account-brand-mark">
              <img src={ROBOTICSFUND_LOGO} alt="RoboticsFund" />
            </div>
            <div className="account-profile-copy">
              <h1>{user.fullName || "Mon compte"}</h1>
              <p>
                {country?.phonePrefix ? `+${country.phonePrefix} ${user.phone}` : user.phone}
              </p>
            </div>
          </div>
        </header>

        <section className="account-overview" aria-label="Résumé du compte">
          <article className="account-balance-card">
            <div className="account-balance-main">
              <div className="account-balance-icon" aria-hidden="true">
                <img src={balanceIcon} alt="" />
              </div>
              <div className="account-balance-copy">
                <span>Solde</span>
                <strong>{formatAmount(user.balance)}</strong>
              </div>
              <button
                type="button"
                className="account-statement-button"
                onClick={() => navigate("/history")}
              >
                Relevé
              </button>
            </div>
            <div className="account-revenue-grid">
              <div className="account-revenue-item">
                <span>Revenus du jour</span>
                <strong>{formatAmount(user.todayEarnings)}</strong>
              </div>
              <div className="account-revenue-item">
                <span>Revenus d’équipe</span>
                <strong>
                  {teamStatsLoading
                    ? "Chargement…"
                    : teamStatsError
                      ? "Indisponible"
                      : formatAmount(teamStats?.totalCommission)}
                </strong>
              </div>
            </div>
          </article>
        </section>

        <section className="account-shortcuts" aria-label="Opérations du compte">
          <button type="button" onClick={() => navigate("/deposit")}>
            <span className="account-shortcut-icon" aria-hidden="true">
              <img src={depositIcon} alt="" />
            </span>
            Recharger
          </button>
          <button type="button" onClick={() => navigate("/withdrawal")}>
            <span className="account-shortcut-icon" aria-hidden="true">
              <img src={withdrawalIcon} alt="" />
            </span>
            Retirer
          </button>
        </section>

        <button
          type="button"
          className="account-wallet-card"
          onClick={() => navigate("/wallet")}
          aria-label="Gérer le compte bancaire"
        >
          <span className="account-wallet-icon" aria-hidden="true">
            <img src={bankAccountIcon} alt="" />
          </span>
          <span className="account-wallet-copy">
            <strong>Compte bancaire</strong>
            <span>Enregistrez vos coordonnées pour vos retraits</span>
          </span>
          <span className={`account-wallet-status${wallets?.length ? " is-linked" : ""}`}>
            {walletStatus}
          </span>
          <ChevronRight className="account-wallet-chevron" aria-hidden="true" />
        </button>

        <section className="account-services" aria-labelledby="account-services-title">
          <h2 id="account-services-title">Autres services</h2>
          <div className="account-links">
            {accountLinks.map(({ label, Icon, image, onSelect }) => (
              <button
                key={label}
                type="button"
                className={`account-link${label === "Déconnexion" ? " account-link-logout" : ""}`}
                onClick={onSelect}
              >
                <span className="account-link-icon" aria-hidden="true">
                  {image ? <img src={image} alt="" /> : Icon && <Icon />}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {user.isAdmin && (
          <button type="button" className="account-admin-button" onClick={handleAdminClick}>
            <Shield aria-hidden="true" />
            Panel Admin
          </button>
        )}
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