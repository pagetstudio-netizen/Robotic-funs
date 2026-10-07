import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { getCountryByCode } from "@/lib/countries";
import withdrawalReferenceScreenshot from "@assets/Screenshot_20261007-115910_1791408803361.png";

interface WalletData {
  id: number;
  userId: number;
  accountName: string;
  accountNumber: string;
  paymentMethod: string;
  country: string;
  isDefault: boolean;
}

interface UserProduct {
  id: number;
  status: string;
}

export default function WithdrawalPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number | "">("");
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [, navigate] = useLocation();

  const countryInfo = user ? getCountryByCode(user.country) : null;
  const configuredCurrency = countryInfo?.currency || "XOF";
  const currency = configuredCurrency === "FCFA" ? "XOF" : configuredCurrency;

  const { data: withdrawalSettings } = useQuery<{
    withdrawalFees: number;
    withdrawalStartHour: number;
    withdrawalEndHour: number;
    maxWithdrawalsPerDay: number;
    minWithdrawal: number;
  }>({
    queryKey: ["/api/settings/withdrawal"],
  });

  const minWithdrawal = withdrawalSettings?.minWithdrawal ?? 1500;
  const withdrawalFee = withdrawalSettings?.withdrawalFees ?? 18;
  const withdrawalStartHour = withdrawalSettings?.withdrawalStartHour ?? 9;
  const withdrawalEndHour = withdrawalSettings?.withdrawalEndHour ?? 17;
  const maxWithdrawalsPerDay = withdrawalSettings?.maxWithdrawalsPerDay ?? 2;

  const amountAfterFees = amount ? Math.round(Number(amount) * (1 - withdrawalFee / 100)) : 0;
  const currentHour = new Date().getHours();
  const isWithinWithdrawalHours = currentHour >= withdrawalStartHour && currentHour < withdrawalEndHour;

  const { data: wallets = [], isLoading: walletsLoading } = useQuery<WalletData[]>({
    queryKey: ["/api/wallets"],
  });

  const { data: userProducts = [] } = useQuery<UserProduct[]>({
    queryKey: ["/api/user/products"],
  });

  const hasActiveProduct = userProducts.some((p) => p.status === "active");

  useEffect(() => {
    if (user?.country.trim().toUpperCase() === "BJ") {
      if (wallets.length === 0) return;

      const savedWalletId = localStorage.getItem("selectedWalletId");
      if (savedWalletId) {
        const wallet = wallets.find(w => w.id === Number(savedWalletId));
        localStorage.removeItem("selectedWalletId");
        if (wallet) {
          setSelectedWallet(wallet);
          return;
        }
      }

      setSelectedWallet((current) => {
        if (current && wallets.some((wallet) => wallet.id === current.id)) return current;
        return wallets.find((wallet) => wallet.isDefault) ?? null;
      });
      return;
    }

    const savedWalletId = localStorage.getItem("selectedWalletId");
    if (savedWalletId && wallets.length > 0) {
      const wallet = wallets.find(w => w.id === parseInt(savedWalletId));
      if (wallet) setSelectedWallet(wallet);
      localStorage.removeItem("selectedWalletId");
    }
  }, [wallets, user?.country]);

  useEffect(() => {
    if (user?.country.trim().toUpperCase() === "BJ") return;
    if (!selectedWallet && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.isDefault);
      if (defaultWallet) setSelectedWallet(defaultWallet);
    }
  }, [wallets, selectedWallet, user?.country]);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; walletId: number }) => {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Demande envoyée", description: "Votre demande de retrait a été envoyée." });
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      setAmount("");
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!isWithinWithdrawalHours) {
      toast({ title: "Horaires de retrait", description: `Les retraits sont disponibles de ${withdrawalStartHour}h à ${withdrawalEndHour}h`, variant: "destructive" });
      return;
    }
    if (!hasActiveProduct) {
      toast({ title: "Produit requis", description: "Vous devez avoir un produit actif pour effectuer un retrait", variant: "destructive" });
      return;
    }
    if (!amount || amount < minWithdrawal) {
      toast({ title: "Montant invalide", description: `Le montant minimum est de ${minWithdrawal} ${currency}`, variant: "destructive" });
      return;
    }
    if (!selectedWallet) {
      toast({ title: "Compte requis", description: "Veuillez sélectionner un compte bancaire", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({ amount: Number(amount), walletId: selectedWallet.id });
  };

  if (walletsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00CC2C]" />
      </div>
    );
  }

  if (!user) return null;

  const balance = parseFloat(user?.balance || "0");

  return (
    <main className="withdraw-reference">
      <style>{`
        .withdraw-reference {
          color: #151515;
          font-family: Inter, Arial, sans-serif;
        }
        .withdraw-reference .withdraw-screen {
          width: 100%;
          max-width: 500px;
          min-height: 100vh;
          margin: 0 auto;
          overflow: hidden;
          background: #f7f4f2;
        }
        .withdraw-reference .withdraw-hero {
          position: relative;
          height: min(70.7vw, 354px);
          min-height: 283px;
          background: #ffca2b;
        }
        .withdraw-reference .history-button {
          position: absolute;
          z-index: 3;
          top: 14px;
          right: 16px;
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border: 0;
          border-radius: 12px;
          background: rgba(255,255,255,.24);
        }
        .withdraw-reference .history-icon {
          position: relative;
          width: 30px;
          height: 30px;
          border: 2px solid #367c2b;
          border-radius: 4px;
          background: transparent;
        }
        .withdraw-reference .history-icon::before {
          position: absolute;
          top: 6px;
          left: 5px;
          width: 16px;
          height: 2px;
          content: "";
          background: #367c2b;
          box-shadow: 0 6px 0 #367c2b;
        }
        .withdraw-reference .history-icon::after {
          position: absolute;
          right: -7px;
          bottom: -7px;
          width: 11px;
          height: 11px;
          border: 2px solid #367c2b;
          border-radius: 50%;
          content: "";
          background: #ffde00;
        }
        .withdraw-reference .hero-art {
          position: relative;
          width: 100%;
          height: min(36.65vw, 183px);
          overflow: hidden;
        }
        .withdraw-reference .hero-art::before,
        .withdraw-reference .hero-art::after {
          position: absolute;
          content: "";
          border-radius: 42% 58% 52% 48%;
          background: #fdb900;
          transform: rotate(-12deg);
        }
        .withdraw-reference .hero-art::before {
          top: -24px;
          left: -25px;
          width: 168px;
          height: 128px;
          box-shadow:
            84px 23px 0 -20px #fdb900,
            330px 18px 0 5px rgba(255,255,255,.14);
        }
        .withdraw-reference .hero-art::after {
          top: 33px;
          right: 58px;
          width: 121px;
          height: 92px;
          background: rgba(255,255,255,.16);
          transform: rotate(18deg);
        }
        .withdraw-reference .hero-pattern {
          position: absolute;
          top: 10px;
          right: -24px;
          width: 205px;
          height: 145px;
          border-radius: 50%;
          background: rgba(255,255,255,.12);
          transform: rotate(-18deg);
        }
        .withdraw-reference .withdraw-title {
          position: absolute;
          z-index: 2;
          top: 82px;
          right: 0;
          left: 0;
          margin: 0;
          color: #111;
          font-size: 28px;
          font-weight: 500;
          line-height: 1;
          text-align: center;
        }
        .withdraw-reference .receipt-icon {
          position: absolute;
          z-index: 2;
          top: 15px;
          right: 25px;
          width: 25px;
          height: 31px;
          border: 3px solid #40b9cf;
          border-radius: 4px;
          transform: rotate(2deg);
        }
        .withdraw-reference .receipt-icon::before,
        .withdraw-reference .receipt-icon::after {
          position: absolute;
          left: 5px;
          content: "";
          width: 10px;
          height: 3px;
          border-radius: 3px;
          background: #367c2b;
        }
        .withdraw-reference .receipt-icon::before {
          top: 8px;
          box-shadow: 0 7px 0 #367c2b;
        }
        .withdraw-reference .receipt-icon::after {
          top: 20px;
          left: 12px;
          width: 6px;
          height: 6px;
          border: 2px solid #367c2b;
          border-radius: 50%;
          background: transparent;
        }
        .withdraw-reference .withdraw-back {
          position: absolute;
          z-index: 3;
          top: 85px;
          left: 24px;
          width: 40px;
          height: 40px;
          border: 0;
          background: transparent;
        }
        .withdraw-reference .withdraw-back::before {
          position: absolute;
          top: 14px;
          left: 9px;
          width: 14px;
          height: 14px;
          border-bottom: 3px solid #111;
          border-left: 3px solid #111;
          content: "";
          transform: rotate(45deg);
        }
        .withdraw-reference .balance-card {
          position: absolute;
          top: min(36.45vw, 182px);
          right: 16px;
          left: 16px;
          height: 160px;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,.88);
          border-radius: 10px;
          background: linear-gradient(110deg, #ffde00 0%, #fff6bf 100%);
          box-shadow: 0 1px 2px rgba(202,151,0,.1);
        }
        .withdraw-reference .balance-label {
          margin: 29px 0 0 15px;
          color: #25591c;
          font-size: 23px;
          font-weight: 800;
          line-height: 1;
        }
        .withdraw-reference .balance-value {
          margin: 20px 0 0 15px;
          color: #25591c;
          font-size: 43px;
          font-weight: 800;
          line-height: .9;
        }
        .withdraw-reference .balance-value span {
          margin-left: 3px;
          font-size: 28px;
        }
        .withdraw-reference .wallet-mark {
          position: absolute;
          top: 14px;
          right: 14px;
          display: grid;
          width: 109px;
          height: 109px;
          place-items: center;
          border-radius: 50%;
          background: white;
        }
        .withdraw-reference .wallet-mark img {
          width: 67px;
          height: 67px;
          object-fit: contain;
        }
        .withdraw-reference .amount-panel {
          min-height: 154px;
          padding: 25px 35px 16px;
          background: white;
        }
        .withdraw-reference .amount-label {
          margin: 0 0 7px 9px;
          color: #c98e41;
          font-size: 16px;
          font-weight: 400;
        }
        .withdraw-reference .amount-field {
          display: flex;
          height: 54px;
          align-items: center;
          overflow: hidden;
          border-radius: 12px;
          background: #f3f0ee;
        }
        .withdraw-reference .amount-field input {
          width: 100%;
          min-width: 0;
          height: 100%;
          padding: 0 21px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #656565;
          font-size: 19px;
        }
        .withdraw-reference .amount-field input::placeholder { color: #777; opacity: 1; }
        .withdraw-reference .amount-currency {
          padding-right: 20px;
          color: #767676;
          font-size: 24px;
        }
        .withdraw-reference .amount-details {
          display: flex;
          justify-content: space-between;
          margin-top: 14px;
          color: #191919;
          font-size: 14px;
        }
        .withdraw-reference .wallet-choice {
          display: flex;
          width: calc(100% - 32px);
          height: 53px;
          align-items: center;
          margin: 12px 16px 0;
          padding: 0 17px;
          border-radius: 5px;
          background: linear-gradient(112deg, #367c2b 0%, #25591c 100%);
          color: white;
          text-align: left;
          box-shadow: 0 1px 2px rgba(214,153,0,.15);
        }
        .withdraw-reference .wallet-choice img {
          width: 34px;
          height: 34px;
          margin-right: 10px;
          object-fit: contain;
        }
        .withdraw-reference .wallet-choice svg:last-child {
          width: 22px;
          height: 22px;
          margin-left: auto;
        }
        .withdraw-reference .wallet-copy {
          overflow: hidden;
          font-size: 16px;
          font-weight: 400;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .withdraw-reference .instructions {
          padding: 28px 9px 20px;
        }
        .withdraw-reference .instructions-title {
          margin-bottom: 29px;
          font-size: 17px;
          font-weight: 800;
        }
        .withdraw-reference .instructions-title::before {
          content: "💸";
          margin-right: 8px;
          font-size: 17px;
        }
        .withdraw-reference .instruction {
          position: relative;
          margin: 0 0 26px 28px;
          font-size: 17px;
          font-weight: 500;
          line-height: 1.65;
        }
        .withdraw-reference .instruction::before {
          content: "◆";
          position: absolute;
          top: 2px;
          left: -19px;
          color: #367c2b;
          font-size: 9px;
        }
        .withdraw-reference .instruction strong { font-weight: 800; }
        .withdraw-reference .submit {
          display: flex;
          width: calc(100% - 48px);
          min-height: 57px;
          align-items: center;
          justify-content: center;
          margin: 4px 24px 35px;
          border-radius: 29px;
          background: linear-gradient(112deg, #367c2b 0%, #25591c 100%);
          color: white;
          font-size: 17px;
          font-weight: 600;
        }
        .withdraw-reference .submit:disabled { opacity: .6; }
        @media (max-width: 360px) {
          .withdraw-reference .balance-card { right: 10px; left: 10px; }
          .withdraw-reference .wallet-mark { transform: scale(.82); transform-origin: top right; }
          .withdraw-reference .balance-label { font-size: 20px; }
          .withdraw-reference .balance-value { font-size: 37px; }
          .withdraw-reference .amount-panel { padding-right: 25px; padding-left: 25px; }
          .withdraw-reference .instruction { font-size: 15px; }
        }

        /* Light RoboticsFund layout matching the supplied withdrawal reference. */
        .withdraw-reference {
          --withdrawal-green: var(--jd-green, #367c2b);
          --withdrawal-green-dark: var(--jd-green-dark, #25591c);
          --withdrawal-yellow: var(--jd-yellow, #ffde00);
          --withdrawal-yellow-soft: var(--jd-yellow-soft, #fff6bf);
          min-height: 100dvh;
          background: #edf4e6;
          color: #20251f;
        }
        .withdraw-reference .withdraw-screen {
          width: min(100%, 500px);
          min-height: 100dvh;
          padding-bottom: 20px;
          background: #edf4e6;
        }
        .withdraw-reference .withdraw-hero {
          display: grid;
          height: 72px;
          min-height: 72px;
          place-items: center;
          border-bottom: 3px solid var(--withdrawal-green);
          background: var(--withdrawal-yellow);
        }
        .withdraw-reference .hero-art { display: none; }
        .withdraw-reference .withdraw-title {
          position: static;
          color: #1f2d1b;
          font-size: 23px;
          font-weight: 700;
          line-height: 1.1;
        }
        .withdraw-reference .history-button,
        .withdraw-reference .withdraw-back {
          top: 50%;
          display: grid;
          width: 44px;
          height: 44px;
          min-width: 44px;
          max-width: 44px;
          place-items: center;
          transform: translateY(-50%);
          border: 0;
          border-radius: 13px;
          background: var(--withdrawal-green);
          box-shadow: 0 2px 5px rgba(31, 65, 24, .2);
          color: #fff;
          text-decoration: none;
        }
        .withdraw-reference .history-button {
          right: 14px;
        }
        .withdraw-reference .history-button:hover,
        .withdraw-reference .withdraw-back:hover {
          opacity: .92;
          transform: translateY(-50%);
        }
        .withdraw-reference .history-button:focus-visible,
        .withdraw-reference .withdraw-back:focus-visible,
        .withdraw-reference .wallet-choice:focus-visible,
        .withdraw-reference .submit:focus-visible {
          outline: 3px solid #f4b33d;
          outline-offset: 3px;
        }
        .withdraw-reference .history-button img {
          display: block;
          width: 24px;
          height: 29px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }
        .withdraw-reference .withdraw-back {
          left: 14px;
          color: #fff;
        }
        .withdraw-reference .withdraw-back::before {
          display: none;
        }
        .withdraw-reference .withdraw-back svg {
          width: 25px;
          height: 25px;
          stroke-width: 2.8;
        }
        .withdraw-reference .balance-card {
          position: relative;
          top: auto;
          right: auto;
          left: auto;
          display: flex;
          min-height: 108px;
          height: auto;
          align-items: center;
          gap: 16px;
          margin: 12px 16px 0;
          padding: 16px 18px;
          border: 1px solid rgba(54, 124, 43, .16);
          border-radius: 14px;
          background: linear-gradient(110deg, var(--withdrawal-yellow) 0%, var(--withdrawal-yellow-soft) 100%);
          box-shadow: 0 3px 8px rgba(25, 70, 22, .1);
        }
        .withdraw-reference .wallet-mark {
          position: static;
          display: grid;
          width: 64px;
          height: 64px;
          flex: 0 0 64px;
          place-items: center;
          border-radius: 14px;
          background: #fff;
        }
        .withdraw-reference .wallet-mark img {
          width: 46px;
          height: 44px;
          object-fit: contain;
          filter: brightness(0) saturate(100%) invert(30%) sepia(25%) saturate(1071%) hue-rotate(65deg) brightness(94%) contrast(91%);
        }
        .withdraw-reference .balance-label {
          margin: 0;
          color: #486643;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.2;
        }
        .withdraw-reference .balance-value {
          margin: 7px 0 0;
          color: var(--withdrawal-green-dark);
          font-size: clamp(29px, 8vw, 38px);
          font-weight: 800;
          letter-spacing: -.035em;
          line-height: 1;
          white-space: nowrap;
        }
        .withdraw-reference .wallet-panel {
          margin: 20px 20px 0;
        }
        .withdraw-reference .wallet-prompt {
          margin: 0 0 10px;
          color: #252c23;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.4;
        }
        .withdraw-reference .wallet-choice {
          width: 100%;
          min-height: 54px;
          height: auto;
          gap: 12px;
          margin: 0;
          padding: 8px 13px;
          border: 1.5px solid rgba(54, 124, 43, .58);
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 1px 3px rgba(25, 70, 22, .08);
          color: #273326;
        }
        .withdraw-reference .wallet-choice img {
          width: 32px;
          height: 31px;
          flex: 0 0 32px;
          margin: 0;
          object-fit: contain;
          filter: brightness(0) saturate(100%) invert(30%) sepia(25%) saturate(1071%) hue-rotate(65deg) brightness(94%) contrast(91%);
        }
        .withdraw-reference .wallet-choice svg:last-child {
          color: var(--withdrawal-green);
        }
        .withdraw-reference .wallet-copy {
          min-width: 0;
          font-size: 15px;
        }
        .withdraw-reference .amount-panel {
          min-height: 0;
          margin: 20px 20px 0;
          padding: 0;
          background: transparent;
        }
        .withdraw-reference .amount-label {
          margin: 0 0 8px;
          color: #252c23;
          font-size: 18px;
          font-weight: 700;
        }
        .withdraw-reference .amount-field {
          height: 58px;
          gap: 14px;
          padding: 0 14px;
          border: 1px solid rgba(54, 124, 43, .24);
          border-bottom: 2px solid var(--withdrawal-green);
          border-radius: 10px 10px 3px 3px;
          background: #fff;
        }
        .withdraw-reference .amount-field input {
          order: 2;
          flex: 1;
          padding: 0;
          color: #252c23;
          font-size: 17px;
        }
        .withdraw-reference .amount-field input::placeholder {
          color: #7a8078;
        }
        .withdraw-reference .amount-currency {
          order: 1;
          flex: 0 0 auto;
          padding: 0;
          color: var(--withdrawal-green);
          font-size: 25px;
          font-weight: 700;
        }
        .withdraw-reference .amount-details {
          flex-wrap: wrap;
          gap: 5px 14px;
          margin-top: 8px;
          color: #606a5d;
          font-size: 12px;
        }
        .withdraw-reference .submit {
          width: calc(100% - 56px);
          min-height: 56px;
          margin: 22px 28px 0;
          border-radius: 13px;
          background: linear-gradient(112deg, var(--withdrawal-green) 0%, var(--withdrawal-green-dark) 100%);
          box-shadow: 0 3px 8px rgba(25, 70, 22, .18);
          color: #fff;
          font-size: 19px;
          font-weight: 700;
        }
        .withdraw-reference .submit:hover:not(:disabled) {
          background: var(--withdrawal-green-dark);
        }
        .withdraw-reference .instructions {
          padding: 22px 20px 4px;
        }
        .withdraw-reference .instructions-title {
          margin: 0 0 12px;
          color: var(--withdrawal-green-dark);
          font-size: 16px;
          font-weight: 700;
        }
        .withdraw-reference .instructions-title::before {
          display: none;
        }
        .withdraw-reference .instructions-list {
          display: grid;
          gap: 9px;
          margin: 0;
          padding-left: 22px;
          color: #3f493c;
        }
        .withdraw-reference .instructions-list li {
          padding-left: 3px;
          font-size: 13px;
          font-weight: 400;
          line-height: 1.5;
        }
        .withdraw-reference .instructions-list li::marker {
          color: var(--withdrawal-green);
          font-weight: 700;
        }
        @media (max-width: 360px) {
          .withdraw-reference .balance-card {
            margin-right: 10px;
            margin-left: 10px;
            padding-right: 12px;
            padding-left: 12px;
          }
          .withdraw-reference .wallet-mark {
            transform: none;
          }
          .withdraw-reference .wallet-panel,
          .withdraw-reference .amount-panel,
          .withdraw-reference .instructions {
            margin-right: 14px;
            margin-left: 14px;
          }
        }

        /* Dark charcoal and gold layout from the supplied mobile reference. */
        .withdraw-reference {
          --withdrawal-gold: #efc85a;
          min-height: 100dvh;
          overflow-x: hidden;
          background: #111;
          color: #f4f1eb;
          font-family: Georgia, "Times New Roman", serif;
        }
        .withdraw-reference .withdraw-screen {
          width: min(100%, 432px);
          min-height: 100dvh;
          margin: 0 auto;
          padding: 30px 0 28px;
          overflow-x: hidden;
          background: #111;
        }
        .withdraw-reference .withdraw-header {
          height: 40px;
          margin: 0;
          padding-left: 10px;
        }
        .withdraw-reference .withdraw-back {
          position: static;
          display: grid;
          width: 40px;
          height: 40px;
          min-width: 40px;
          max-width: 40px;
          place-items: center;
          transform: none;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          color: #f2f2f2;
        }
        .withdraw-reference .withdraw-back:hover {
          transform: none;
          opacity: .8;
        }
        .withdraw-reference .withdraw-back svg {
          width: 28px;
          height: 28px;
          stroke-width: 2.5;
        }
        .withdraw-reference .withdraw-top-row {
          display: grid;
          width: 100%;
          min-height: 140px;
          grid-template-columns: 34.5% 57.5%;
          column-gap: 4%;
          align-items: start;
          margin: 13px 0 21px 4%;
        }
        .withdraw-reference .balance-card {
          position: static;
          display: block;
          min-height: 0;
          height: auto;
          margin: 0;
          padding: 18px 0 0;
          overflow: visible;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }
        .withdraw-reference .balance-label {
          margin: 0;
          color: #aaa8a5;
          font-size: 17px;
          font-weight: 400;
          line-height: 1.15;
        }
        .withdraw-reference .balance-value {
          margin: 8px 0 0;
          color: #f6f4ef;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1.1;
          white-space: nowrap;
        }
        .withdraw-reference .wallet-edit {
          display: flex;
          width: 112px;
          height: 40px;
          align-items: center;
          justify-content: center;
          margin-top: 14px;
          padding: 0 10px;
          border: 0;
          border-radius: 23px;
          background: #252525;
          color: #f4f1eb;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 700;
          white-space: nowrap;
        }
        .withdraw-reference .withdraw-promo {
          width: 100%;
          aspect-ratio: 496 / 280;
          border-radius: 18px 0 0 18px;
          background-image: url("${withdrawalReferenceScreenshot}");
          background-position: 100% 15.75%;
          background-repeat: no-repeat;
          background-size: 174.1935% 617.1429%;
        }
        .withdraw-reference .amount-panel {
          box-sizing: border-box;
          width: 92%;
          min-height: 0;
          margin: 0 0 0 4%;
          padding: 23px 11px 24px;
          border-radius: 18px;
          background: #24232f;
          color: #f4f1eb;
        }
        .withdraw-reference .amount-field {
          height: 56px;
          gap: 14px;
          padding: 0 16px;
          border: 0;
          border-radius: 30px;
          background: #fff0c9;
        }
        .withdraw-reference .amount-field input {
          order: 2;
          flex: 1;
          min-width: 0;
          padding: 0;
          color: #151515;
          font-family: Arial, sans-serif;
          font-size: 17px;
          font-weight: 700;
        }
        .withdraw-reference .amount-field input::placeholder {
          color: #74716c;
          opacity: 1;
        }
        .withdraw-reference .amount-currency {
          order: 1;
          flex: 0 0 auto;
          padding: 0;
          color: #16130d;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 700;
        }
        .withdraw-reference .amount-details {
          display: none;
        }
        .withdraw-reference .wallet-panel {
          margin: 28px 0 0;
        }
        .withdraw-reference .wallet-prompt {
          margin: 0;
          color: #f5f3ee;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.25;
        }
        .withdraw-reference .wallet-account-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 82px;
          gap: 10px;
          margin-top: 10px;
        }
        .withdraw-reference .wallet-account-number {
          display: flex;
          min-width: 0;
          height: 56px;
          align-items: center;
          overflow: hidden;
          padding: 0 18px;
          border-radius: 30px;
          background: #fff0c9;
          color: #171717;
          font-family: Arial, sans-serif;
          font-size: 17px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .withdraw-reference .wallet-choice {
          display: flex;
          width: 82px;
          min-height: 56px;
          height: 56px;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0 5px;
          border: 0;
          border-radius: 6px;
          background: #1f1f20;
          box-shadow: none;
          color: #fff;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 17px;
          font-weight: 700;
          white-space: nowrap;
        }
        .withdraw-reference .wallet-choice:hover {
          background: #2c2c2d;
        }
        .withdraw-reference .wallet-choice:focus-visible,
        .withdraw-reference .wallet-edit:focus-visible,
        .withdraw-reference .submit:focus-visible {
          outline: 2px solid #fff0c9;
          outline-offset: 3px;
        }
        .withdraw-reference .submit {
          width: 100%;
          min-height: 56px;
          height: 56px;
          margin: 50px 0 0;
          border-radius: 30px;
          background: var(--withdrawal-gold);
          box-shadow: none;
          color: #211b10;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 700;
        }
        .withdraw-reference .submit:hover:not(:disabled) {
          background: #f5d46d;
        }
        .withdraw-reference .instructions {
          padding: 23px 0 0;
        }
        .withdraw-reference .rules-heading {
          margin: 0 0 9px;
          color: #f4f1eb;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.2;
        }
        .withdraw-reference .instructions-title {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0;
          color: #ffe000;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 19px;
          font-weight: 700;
          line-height: 1.25;
        }
        .withdraw-reference .instructions-title::before {
          display: none;
          content: none;
        }
        .withdraw-reference .instructions-list {
          display: block;
          margin: 22px 0 0;
          padding-left: 22px;
          color: #f6f4ef;
        }
        .withdraw-reference .instructions-list li {
          margin: 0 0 14px;
          padding-left: 0;
          color: #f6f4ef;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 400;
          line-height: 1.45;
        }
        .withdraw-reference .instructions-list li::marker {
          color: #ffe000;
          font-weight: 700;
        }
        .withdraw-reference .instructions-list strong {
          color: #ffe000;
          font-weight: 700;
        }
        @media (max-width: 360px) {
          .withdraw-reference .withdraw-screen {
            padding-top: 28px;
          }
          .withdraw-reference .wallet-account-row {
            grid-template-columns: minmax(0, 1fr) 74px;
            gap: 8px;
          }
          .withdraw-reference .wallet-choice {
            width: 74px;
            font-size: 16px;
          }
          .withdraw-reference .amount-panel {
            padding-right: 9px;
            padding-left: 9px;
          }
          .withdraw-reference .instructions-list li {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="withdraw-screen">
        <header className="withdraw-header">
          <Link
            href="/account"
            className="withdraw-back"
            data-testid="button-back"
            aria-label="Retour"
          >
            <ChevronLeft aria-hidden="true" />
          </Link>
        </header>

        <div className="withdraw-top-row">
          <section className="balance-card" aria-label="Solde disponible">
            <div className="balance-copy">
              <p className="balance-label">Solde actuel</p>
              <p className="balance-value" data-testid="text-balance">
                {Math.round(balance).toLocaleString("fr-FR")} {currency}
              </p>
              <button
                type="button"
                className="wallet-edit"
                onClick={() => navigate("/history")}
              >
                Enregistrer
              </button>
            </div>
          </section>
          <div
            className="withdraw-promo"
            role="img"
            aria-label="Retrait — Retirer des fonds du solde"
          />
        </div>

        <section className="amount-panel" aria-label="Faire un retrait">
          <label className="amount-field">
            <span className="amount-currency">{currency}</span>
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value ? Number(event.target.value) : "")}
              placeholder="Montant du retrait"
              data-testid="input-withdrawal-amount"
              aria-label="Montant de retrait"
            />
          </label>
          <div className="amount-details" aria-hidden="true">
            <span>Montant reçu : {amountAfterFees.toLocaleString("fr-FR")} {currency}</span>
            <span>Taux de frais : {withdrawalFee}%</span>
          </div>

          <section className="wallet-panel" aria-label="Portefeuille de retrait">
            <p className="wallet-prompt">Paramètres du compte de retrait</p>
            <div className="wallet-account-row">
              <div
                className="wallet-account-number"
                aria-label={selectedWallet
                  ? `Compte de ${selectedWallet.accountName}, ${selectedWallet.accountNumber}`
                  : "Aucun compte de retrait enregistré"}
              >
                {selectedWallet?.accountNumber || "Aucun compte enregistré"}
              </div>
              <button
                type="button"
                onClick={() => navigate("/wallet")}
                className="wallet-choice"
                data-testid="button-select-wallet"
              >
                Compte
              </button>
            </div>
          </section>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={withdrawMutation.isPending}
            className="submit"
            data-testid="button-submit-withdrawal"
          >
            {withdrawMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmer"}
          </button>

          <section className="instructions" aria-label="Instructions de retrait">
            <h2 className="rules-heading">Règles de retrait :</h2>
            <p className="instructions-title">
              <span aria-hidden="true">📢</span>
              Instructions de retrait
            </p>
            <ol className="instructions-list">
              <li>
                Montant minimum de retrait : <strong>{minWithdrawal.toLocaleString("fr-FR")} {currency}</strong>.
              </li>
              <li>
                Les retraits sont possibles de{" "}
                <strong>
                  {String(withdrawalStartHour).padStart(2, "0")}h00 à{" "}
                  {String(withdrawalEndHour).padStart(2, "0")}h00
                </strong>{" "}
                tous les jours.
              </li>
              <li>
                Des frais de transaction <strong>de {withdrawalFee} %</strong> seront facturés pour chaque retrait.
              </li>
              <li>
                Un produit actif est nécessaire pour effectuer un retrait, dans la limite de{" "}
                <strong>{maxWithdrawalsPerDay} demande(s) par jour</strong>.
              </li>
            </ol>
          </section>
        </section>
      </div>
    </main>
  );
}
