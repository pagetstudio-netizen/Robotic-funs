import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getJohnDeereProductImage } from "@/lib/john-deere-assets";
import { useToast } from "@/hooks/use-toast";
import { isProductStockFull } from "@shared/product-purchase-limit";
import { Loader2, RefreshCw } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/empty-state";
import depositIcon from "@assets/Rechange_1791379514799.png";
import withdrawalIcon from "@assets/Withdraw-1_1791379514849.png";
import serviceIcon from "@assets/Service-2_1791379514881.png";
import downloadIcon from "@assets/Download_1791379514913.png";
import shareRobot from "@assets/file_000000004d8081f4bc975fdd26cf35e2_1791382630587.png";

type HomeProduct = Product & {
  canClaimFree?: boolean;
  stockCount?: number;
  canPurchaseThisLaunch?: boolean;
};
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type HomeQuickAction = {
  label: string;
  image: string;
  path?: string;
  download?: boolean;
};

const quickActions: HomeQuickAction[] = [
  { label: "Recharger", image: depositIcon, path: "/deposit" },
  { label: "Retrait", image: withdrawalIcon, path: "/withdrawal" },
  { label: "Service", image: serviceIcon, path: "/service" },
  { label: "Télécharger", image: downloadIcon, download: true },
];

const formatFcfa = (amount: number) =>
  `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;

export default function HomeDashboard() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [confirmProduct, setConfirmProduct] = useState<HomeProduct | null>(null);
  const [dailyBonusNoticeOpen, setDailyBonusNoticeOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<"stable" | "activity">("stable");

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery<HomeProduct[]>({
    queryKey: ["/api/products"],
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (product: HomeProduct) => {
      const response = await apiRequest("POST", `/api/products/${product.id}/purchase`, {});
      return response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/user/products"] }),
        refreshUser(),
      ]);
      setConfirmProduct(null);
      toast({
        title: "Produit acheté !",
        description: "Vos gains seront versés en une fois à la fin de la période du produit.",
      });
    },
    onError: (error: Error) => {
      setConfirmProduct(null);
      toast({
        title: "Achat impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const dailyBonusMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/claim-daily-bonus", {});
      return response.json() as Promise<{ success: boolean; message?: string }>;
    },
    onSuccess: async () => {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus-status"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
        refreshUser(),
      ]);
      setDailyBonusNoticeOpen(true);
    },
    onError: async (error: Error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 400) {
        await Promise.allSettled([
          queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus-status"] }),
          refreshUser(),
        ]);
        setDailyBonusNoticeOpen(true);
        return;
      }

      toast({
        title: "Pointage impossible",
        description: error.message || "Impossible de réclamer le bonus quotidien.",
        variant: "destructive",
      });
    },
  });

  const visibleProducts = products.filter(
    (product) => product.isActive && product.productType === selectedProductType,
  );

  const handleQuickAction = async (action: HomeQuickAction) => {
    if (action.download) {
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
      return;
    }
    if (action.path) navigate(action.path);
  };

  if (!user) return null;

  return (
    <main className="rf-home">
      <style>{`
        .rf-home {
          min-height: 100dvh;
          padding: 29px 0 calc(70px + env(safe-area-inset-bottom, 0px));
          background: #111111;
          color: #f7f7f8;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .rf-home, .rf-home * { box-sizing: border-box; }
        .rf-home-shell {
          width: 100%;
          max-width: 512px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .rf-hero {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 796 / 338;
          overflow: hidden;
          border-radius: 10px;
          background: #080808;
        }
        .rf-hero-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rf-hero-copy {
          position: absolute;
          inset: 0 auto 0 0;
          display: flex;
          width: 68%;
          flex-direction: column;
          justify-content: center;
          padding: 10px 0 10px 9%;
          background: linear-gradient(90deg, #050505 0%, #050505 78%, rgba(5,5,5,0) 100%);
          color: #fff;
          font-size: clamp(17px, 4.2vw, 22px);
          font-weight: 750;
          line-height: 1.38;
          text-transform: uppercase;
        }
        .rf-actions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: start;
          margin-top: 20px;
        }
        .rf-action {
          display: flex;
          min-width: 0;
          min-height: 80px;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border: 0;
          padding: 0 2px;
          background: transparent;
          color: #f4f4f5;
          cursor: pointer;
          font: inherit;
        }
        .rf-action:active { transform: scale(.97); }
        .rf-action:focus-visible, .rf-product-buy:focus-visible, .rf-retry:focus-visible {
          outline: 2px solid #f3c244;
          outline-offset: 3px;
          border-radius: 8px;
        }
        .rf-action-icon {
          display: block;
          width: 56px;
          height: 56px;
          flex: 0 0 auto;
          object-fit: contain;
        }
        .rf-action-label {
          max-width: 100%;
          overflow: hidden;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.1;
          text-align: center;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rf-checkin {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 796 / 179;
          margin-top: 24px;
          overflow: hidden;
          border-radius: 12px;
          border: 0;
          padding: 0;
          background: #08090c;
          cursor: pointer;
        }
        .rf-checkin img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rf-checkin::before {
          position: absolute;
          z-index: 1;
          inset: 0 43% 0 0;
          background: linear-gradient(90deg, rgba(5,5,8,.98), rgba(5,5,8,.98) 78%, rgba(5,5,8,0));
          content: "";
          pointer-events: none;
        }
        .rf-checkin-label {
          position: absolute;
          top: 50%;
          left: 4%;
          transform: translateY(-50%);
          background: linear-gradient(95deg, #ffe500 7%, #ffbd42 43%, #f35e9b 94%);
          background-clip: text;
          color: transparent;
          font-size: clamp(23px, 7.3vw, 39px);
          font-weight: 750;
          letter-spacing: -.045em;
          line-height: 1;
          z-index: 2;
          -webkit-background-clip: text;
        }
        .rf-checkin:disabled { cursor: wait; }
        .rf-product-category-clip-defs {
          position: absolute;
          width: 0;
          height: 0;
          overflow: hidden;
        }
        .rf-product-category-buttons {
          display: grid;
          width: 100%;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 12px;
          margin: 14px 0 0;
        }
        .rf-product-category-button {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 54px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 0;
          border-radius: 0;
          padding: 8px 10px;
          background: linear-gradient(90deg, #ffb800 0%, #ffd400 100%);
          box-shadow: none;
          color: #151515;
          isolation: isolate;
          clip-path: url(#rf-product-category-card-clip);
          font-size: clamp(13px, 3.5vw, 17px);
          font-weight: 750;
          line-height: 1.15;
          text-align: center;
          cursor: pointer;
          transition: filter .15s ease, transform .15s ease;
        }
        .rf-product-category-button::before {
          position: absolute;
          z-index: -1;
          inset: 0;
          background:
            repeating-linear-gradient(90deg, transparent 0 24px, rgba(255, 248, 101, .12) 25px 28px),
            radial-gradient(ellipse at 54% 45%, rgba(255, 242, 84, .6), transparent 48%);
          content: "";
          pointer-events: none;
        }
        .rf-product-category-watermark {
          position: absolute;
          z-index: -1;
          top: 50%;
          right: 2px;
          height: 145%;
          max-width: 38%;
          transform: translateY(-50%);
          object-fit: contain;
          opacity: .2;
          mix-blend-mode: multiply;
          pointer-events: none;
          user-select: none;
        }
        .rf-product-category-label {
          position: relative;
          z-index: 1;
        }
        .rf-product-category-button:hover { filter: brightness(1.05); }
        .rf-product-category-button:active { transform: scale(.98); }
        .rf-product-category-button:focus-visible {
          outline: 2px solid #f3c244;
          outline-offset: 3px;
        }
        .rf-product-list {
          display: grid;
          gap: 16px;
          margin-top: 25px;
        }
        .rf-product {
          min-width: 0;
          min-height: 154px;
          border-radius: 13px;
          padding: 16px 16px 14px;
          background: #23242f;
        }
        .rf-product-top {
          display: grid;
          min-width: 0;
          grid-template-columns: minmax(96px, 31%) minmax(0, 1fr);
          align-items: center;
          gap: 12px;
        }
        .rf-product-image {
          display: grid;
          width: 100%;
          aspect-ratio: 132 / 87;
          overflow: hidden;
          place-items: center;
          border-radius: 12px;
          background: #15161e;
        }
        .rf-product-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .rf-product-image-fallback {
          color: #6b6d78;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .12em;
        }
        .rf-product-heading {
          display: flex;
          min-width: 0;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        .rf-vip {
          min-width: 56px;
          border-radius: 30px;
          padding: 4px 11px 5px;
          background: #eac35c;
          color: #29231a;
          font-size: 12px;
          line-height: 1;
          text-align: center;
        }
        .rf-product-name {
          max-width: 100%;
          margin: 0;
          overflow: hidden;
          color: #f5f5f7;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rf-product-stock {
          max-width: 100%;
          color: #eac35c;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
        }
        .rf-product-stock.is-full { color: #ed8d79; }
        .rf-product-stats {
          display: grid;
          grid-template-columns: .8fr 1.12fr 1fr 64px;
          align-items: end;
          gap: 4px;
          margin-top: 17px;
        }
        .rf-stat { min-width: 0; }
        .rf-stat-value {
          display: block;
          overflow: hidden;
          color: #e5e5e8;
          font-size: 13px;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rf-stat-label {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          color: #8c8d98;
          font-size: 12px;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rf-product-buy {
          display: flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 23px;
          padding: 0 6px;
          background: #feee48;
          color: #2a2818;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          transition: transform .15s ease, background-color .15s ease;
        }
        .rf-product-buy:hover { background: #ffdf22; }
        .rf-product-buy:active { transform: scale(.96); }
        .rf-product-buy:disabled { cursor: wait; opacity: .7; }
        @media (max-width: 390px) {
          .rf-home-shell { padding-right: 14px; padding-left: 14px; }
          .rf-action-icon { width: 54px; height: 54px; }
          .rf-action-label { font-size: 12px; letter-spacing: -.025em; }
          .rf-product { padding: 14px 12px 13px; }
          .rf-product-top { grid-template-columns: minmax(88px, 31%) minmax(0,1fr); gap: 10px; }
          .rf-product-stats { grid-template-columns: .8fr 1.1fr 1fr 58px; gap: 3px; margin-top: 16px; }
          .rf-stat-value, .rf-stat-label { font-size: 11px; }
          .rf-product-buy { min-height: 32px; padding: 0 4px; font-size: 11px; }
          .rf-product-name { font-size: 15px; }
          .rf-vip { min-width: 52px; font-size: 11px; }
        }
        .rf-loading-card {
          display: grid;
          min-height: 180px;
          gap: 12px;
          border-radius: 13px;
          padding: 18px;
          background: #23242f;
        }
        .rf-skeleton {
          border-radius: 7px;
          background: linear-gradient(100deg, #30313d 25%, #3a3b47 40%, #30313d 60%);
          background-size: 200% 100%;
          animation: rf-shimmer 1.4s ease-in-out infinite;
        }
        .rf-skeleton-line { width: 46%; height: 18px; }
        .rf-skeleton-wide { width: 100%; height: 46px; }
        @keyframes rf-shimmer { to { background-position-x: -200%; } }
        .rf-status {
          display: grid;
          min-height: 140px;
          place-items: center;
          gap: 12px;
          border-radius: 13px;
          padding: 20px;
          background: #23242f;
          color: #aaaab3;
          font-size: 14px;
          text-align: center;
        }
        .rf-retry {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #454653;
          border-radius: 20px;
          padding: 8px 13px;
          background: transparent;
          color: #f3c244;
          cursor: pointer;
          font: inherit;
        }
        .rf-purchase-modal {
          display: flex;
          width: min(388px, calc(100vw - 44px));
          height: 192px;
          flex-direction: column;
          overflow: hidden;
          border: 0;
          border-radius: 6px;
          padding: 0;
          background: #fff;
          color: #333;
          font-family: Roboto, Arial, sans-serif;
          box-shadow: 0 12px 34px rgba(0,0,0,.24);
          outline: none;
        }
        .rf-purchase-description {
          display: flex;
          min-height: 0;
          flex: 1;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 18px 16px;
          color: #333;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.4;
          text-align: center;
        }
        .rf-purchase-actions {
          display: grid;
          height: 56px;
          flex: 0 0 56px;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid #dadada;
          background: #f2f2f2;
        }
        .rf-purchase-action {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: #333;
          cursor: pointer;
          font-family: inherit;
          font-size: 16px;
          font-weight: 400;
          line-height: 1;
          text-transform: uppercase;
        }
        .rf-purchase-action + .rf-purchase-action {
          border-left: 1px solid #d5d5d5;
          color: #71acd2;
        }
        .rf-purchase-action:focus-visible {
          outline: 2px solid #71acd2;
          outline-offset: -4px;
        }
        .rf-purchase-action:disabled { cursor: wait; opacity: .65; }
        .rf-daily-bonus-notice {
          display: flex;
          width: min(388px, calc(100vw - 44px));
          height: 192px;
          flex-direction: column;
          overflow: hidden;
          border: 0;
          border-radius: 6px;
          padding: 0;
          background: #fff;
          color: #333;
          font-family: Roboto, Arial, sans-serif;
          box-shadow: 0 12px 34px rgba(0,0,0,.24);
          outline: none;
        }
        .rf-daily-bonus-notice-message {
          display: flex;
          min-height: 0;
          flex: 1;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 18px 16px;
          color: #333;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.4;
          text-align: center;
        }
        .rf-daily-bonus-notice-action {
          display: flex;
          width: 100%;
          height: 56px;
          flex: 0 0 56px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-top: 1px solid #dadada;
          padding: 0;
          background: #f2f2f2;
          color: #71acd2;
          cursor: pointer;
          font-family: inherit;
          font-size: 16px;
          font-weight: 400;
          line-height: 1;
          text-transform: uppercase;
        }
        .rf-daily-bonus-notice-action:focus-visible {
          outline: 2px solid #71acd2;
          outline-offset: -4px;
        }
        @media (prefers-reduced-motion: reduce) {
          .rf-home *, .rf-home *::before, .rf-home *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="rf-home-shell">
        <section className="rf-hero" aria-label="Des cadeaux de luxe vous attendent">
          <img className="rf-hero-image" src="/roboticsfund-home-hero.png" alt="" />
          <div className="rf-hero-copy" aria-hidden="true">
            <span>Des cadeaux de luxe</span>
            <span>n’attendent que</span>
            <span>vous !</span>
          </div>
        </section>

        <section className="rf-actions" aria-label="Actions rapides">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="rf-action"
              onClick={() => void handleQuickAction(action)}
              aria-label={action.label}
            >
              <img className="rf-action-icon" src={action.image} alt="" aria-hidden="true" />
              <span className="rf-action-label">{action.label}</span>
            </button>
          ))}
        </section>

        <button
          type="button"
          className="rf-checkin"
          onClick={() => dailyBonusMutation.mutate()}
          disabled={dailyBonusMutation.isPending}
          aria-busy={dailyBonusMutation.isPending}
          aria-label="Réclamer le bonus de pointage"
          data-testid="button-home-claim-daily-bonus"
        >
          <img src="/roboticsfund-checkin-banner.png" alt="" />
          <span className="rf-checkin-label">
            {dailyBonusMutation.isPending ? "Traitement…" : "Pointage"}
          </span>
        </button>

        <svg className="rf-product-category-clip-defs" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="rf-product-category-card-clip" clipPathUnits="objectBoundingBox">
              <path d="M 0.1 0.02 C 0.0448 0.02 0 0.0872 0 0.17 L 0 0.83 C 0 0.9128 0.0448 0.98 0.1 0.98 C 0.3 0.86 0.7 0.86 0.9 0.98 C 0.9552 0.98 1 0.9128 1 0.83 L 1 0.17 C 1 0.0872 0.9552 0.02 0.9 0.02 C 0.7 0.14 0.3 0.14 0.1 0.02 Z" />
            </clipPath>
          </defs>
        </svg>

        <div className="rf-product-category-buttons" role="group" aria-label="Catégories de produits">
          <button
            type="button"
            className="rf-product-category-button"
            aria-pressed={selectedProductType === "stable"}
            onClick={() => setSelectedProductType("stable")}
          >
            <img className="rf-product-category-watermark" src={shareRobot} alt="" aria-hidden="true" />
            <span className="rf-product-category-label">Produits stable</span>
          </button>
          <button
            type="button"
            className="rf-product-category-button"
            aria-pressed={selectedProductType === "activity"}
            onClick={() => {
              setSelectedProductType("activity");
              void refetchProducts();
            }}
          >
            <img className="rf-product-category-watermark" src={shareRobot} alt="" aria-hidden="true" />
            <span className="rf-product-category-label">Produits d'activité</span>
          </button>
        </div>

        <section className="rf-product-list" aria-label="Offres disponibles">
          {productsLoading ? (
            <>
              <div className="rf-loading-card" role="status" aria-label="Chargement des offres">
                <div className="rf-skeleton rf-skeleton-line" />
                <div className="rf-skeleton rf-skeleton-wide" />
              </div>
              <div className="rf-loading-card" aria-hidden="true">
                <div className="rf-skeleton rf-skeleton-line" />
                <div className="rf-skeleton rf-skeleton-wide" />
              </div>
            </>
          ) : productsError ? (
            <div className="rf-status" role="alert">
              <span>Impossible de charger les offres pour le moment.</span>
              <button type="button" className="rf-retry" onClick={() => void refetchProducts()}>
                <RefreshCw size={15} aria-hidden="true" />
                Réessayer
              </button>
            </div>
          ) : visibleProducts.length ? (
            visibleProducts.map((product, index) => {
              const price = Number(product.price) || 0;
              const dailyEarnings = Number(product.dailyEarnings) || 0;
              const cycleDays = Number(product.cycleDays) || 0;
              const totalReturn = Number(product.totalReturn) || dailyEarnings * cycleDays;
              const displayedGain = product.isFree ? dailyEarnings : totalReturn;
              const imageUrl = product.imageUrl || (
                product.productType === "activity"
                  ? getJohnDeereProductImage(null, product.id)
                  : null
              );
              const stockFull = !product.isFree && isProductStockFull(product.stockLimit, product.stockCount || 0);
              const launchAlreadyPurchased = product.productType === "activity"
                && product.canPurchaseThisLaunch === false;
              return (
                <article className="rf-product" key={product.id}>
                  <div className="rf-product-top">
                    <div className="rf-product-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading={index > 1 ? "lazy" : "eager"}
                          onError={(event) => {
                            if (product.productType === "activity") {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = getJohnDeereProductImage(null, product.id);
                            }
                          }}
                        />
                      ) : (
                        <span className="rf-product-image-fallback" aria-hidden="true">RF</span>
                      )}
                    </div>
                    <div className="rf-product-heading">
                      {!product.isFree && <span className="rf-vip">VIP</span>}
                      <h2 className="rf-product-name" title={product.name}>{product.name}</h2>
                      {product.productType === "activity" && product.stockLimit != null && (
                        <span className={`rf-product-stock ${stockFull ? "is-full" : ""}`}>
                          {stockFull
                            ? `Complet (${product.stockCount || 0}/${product.stockLimit})`
                            : `${product.stockCount || 0}/${product.stockLimit} places`}
                        </span>
                      )}
                      {launchAlreadyPurchased && (
                        <span className="rf-product-stock is-full">Déjà acheté pour ce lancement</span>
                      )}
                    </div>
                  </div>
                  <div className="rf-product-stats">
                    <div className="rf-stat">
                      <span className="rf-stat-value">{cycleDays} jours</span>
                      <span className="rf-stat-label">Durée</span>
                    </div>
                    <div className="rf-stat">
                      <span className="rf-stat-value">{product.isFree ? "Gratuit" : formatFcfa(price)}</span>
                      <span className="rf-stat-label">Prix du produit</span>
                    </div>
                    <div className="rf-stat">
                      <span className="rf-stat-value">{formatFcfa(displayedGain)}</span>
                      <span className="rf-stat-label">{product.isFree ? "Bonus quotidien" : "Gain à l’échéance"}</span>
                    </div>
                    <button
                      type="button"
                      className="rf-product-buy"
                      onClick={() => product.isFree
                        ? navigate(`/products/${product.id}`)
                        : setConfirmProduct(product)}
                      disabled={stockFull || launchAlreadyPurchased}
                      aria-label={`${product.isFree ? "Découvrir" : "Acheter"} ${product.name}`}
                    >
                      {stockFull
                        ? "Complet"
                        : launchAlreadyPurchased
                          ? "Déjà acheté"
                          : product.isFree ? "Découvrir" : "Investir"}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState className="rf-status">
              {selectedProductType === "activity"
                ? "Les produits d’activité ne sont pas encore disponibles. Revenez plus tard."
                : "Aucune offre stable disponible pour le moment."}
            </EmptyState>
          )}
        </section>
      </div>

      <Dialog
        open={dailyBonusNoticeOpen}
        onOpenChange={setDailyBonusNoticeOpen}
      >
        {dailyBonusNoticeOpen && (
          <DialogPortal>
            <DialogOverlay className="bg-black/75" />
            <DialogPrimitive.Content
              className="rf-daily-bonus-notice fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
              aria-describedby="rf-daily-bonus-notice-message"
              onEscapeKeyDown={(event) => event.preventDefault()}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <DialogTitle className="sr-only">Pointage terminé</DialogTitle>
              <DialogDescription
                id="rf-daily-bonus-notice-message"
                className="rf-daily-bonus-notice-message"
              >
                La connexion d'aujourd'hui est terminée
              </DialogDescription>
              <button
                type="button"
                className="rf-daily-bonus-notice-action"
                onClick={() => setDailyBonusNoticeOpen(false)}
                data-testid="button-dismiss-daily-bonus-notice"
              >
                D'ACCORD
              </button>
            </DialogPrimitive.Content>
          </DialogPortal>
        )}
      </Dialog>

      <Dialog
        open={Boolean(confirmProduct)}
        onOpenChange={(open) => {
          if (!open && !purchaseMutation.isPending) setConfirmProduct(null);
        }}
      >
        {confirmProduct && (
          <DialogPortal>
            <DialogOverlay className="bg-black/75" />
            <DialogPrimitive.Content
              className="rf-purchase-modal fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
              aria-describedby="rf-purchase-description"
            >
              <DialogTitle className="sr-only">Confirmation d’achat</DialogTitle>
              <DialogDescription id="rf-purchase-description" className="rf-purchase-description">
                Confirmer l'achat de ce produit ?
              </DialogDescription>
              <div className="rf-purchase-actions">
                <button
                  type="button"
                  className="rf-purchase-action"
                  onClick={() => setConfirmProduct(null)}
                  disabled={purchaseMutation.isPending}
                >
                  NON
                </button>
                <button
                  type="button"
                  className="rf-purchase-action"
                  onClick={() => purchaseMutation.mutate(confirmProduct)}
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending
                    ? <Loader2 aria-label="Achat en cours" className="h-5 w-5 animate-spin" />
                    : "OUI"}
                </button>
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        )}
      </Dialog>
    </main>
  );
}
