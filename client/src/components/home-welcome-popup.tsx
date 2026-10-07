import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import telegramIcon from "@assets/groupService-1_1790964412411.png";
import welcomeIllustration from "@assets/1238dd33-a759-49c6-a408-97180f73076e_1790971465728.png";
import "./home-welcome-popup.css";

interface HomePopupSettings {
  groupLink?: string;
  groupEnabled?: string;
  popupButtonLabel?: string;
  signupBonus?: string;
  minDeposit?: string;
  minWithdrawal?: string;
  withdrawalStartHour?: string;
  withdrawalEndHour?: string;
  level1Commission?: string;
}

function safeTelegramUrl(value?: string) {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function formatFcfa(value?: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${Math.round(amount).toLocaleString("fr-FR")} FCFA`
    : "— FCFA";
}

function formatPercent(value?: string) {
  const rate = Number(value);
  return Number.isFinite(rate) ? `${rate}%` : "—";
}

export default function HomeWelcomePopup() {
  const [open, setOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const [location] = useLocation();
  const lastUserId = useRef<string | null>(null);
  const pendingSessionPopup = useRef(false);
  const { data: settings, isLoading } = useQuery<HomePopupSettings>({
    queryKey: ["/api/settings"],
    enabled: open,
  });

  useEffect(() => {
    if (authLoading) return;

    const currentUserId = user?.id == null ? null : String(user.id);
    if (currentUserId === null) {
      pendingSessionPopup.current = false;
    } else if (lastUserId.current === null) {
      pendingSessionPopup.current = true;
    }
    lastUserId.current = currentUserId;

    const isAuthOrRobotPayPage =
      location === "/login" || location === "/register" || location === "/robotpay";
    if (pendingSessionPopup.current && !isAuthOrRobotPayPage) {
      pendingSessionPopup.current = false;
      setOpen(true);
    }
  }, [authLoading, location, user?.id]);

  useEffect(() => {
    const showPopup = () => setOpen(true);
    window.addEventListener("home-tab-clicked", showPopup);
    return () => window.removeEventListener("home-tab-clicked", showPopup);
  }, []);

  const groupUrl = safeTelegramUrl(settings?.groupLink);
  const groupEnabled = settings?.groupEnabled !== "false";
  const canJoinGroup = Boolean(groupUrl && groupEnabled);
  const joinLabel = settings?.popupButtonLabel?.trim() || "Rejoindre le groupe Telegram";
  const withdrawalHours = settings?.withdrawalStartHour && settings?.withdrawalEndHour
    ? `retraits de ${settings.withdrawalStartHour} h à ${settings.withdrawalEndHour} h`
    : "retraits aux heures autorisées";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="home-welcome-overlay" />
        <DialogPrimitive.Content
          className="home-welcome-dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogPrimitive.Title className="home-welcome-title">
            RoboticsFund
          </DialogPrimitive.Title>
          <img
            className="home-welcome-illustration"
            src={welcomeIllustration}
            alt="Personnages de Zootopia réunis autour de 2025"
          />
          <DialogPrimitive.Description className="sr-only">
            Informations de la plateforme et lien du groupe Telegram.
          </DialogPrimitive.Description>

          {canJoinGroup ? (
            <a
              className="home-welcome-telegram"
              href={groupUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={joinLabel}
            >
              <span className="home-welcome-telegram-label">{joinLabel}</span>
              <span className="home-welcome-telegram-icon">
                <img src={telegramIcon} alt="" aria-hidden="true" />
              </span>
            </a>
          ) : (
            <button className="home-welcome-telegram is-unavailable" type="button" disabled>
              <span className="home-welcome-telegram-label">
                {isLoading ? "Chargement du groupe Telegram…" : "Lien Telegram indisponible"}
              </span>
              <span className="home-welcome-telegram-icon">
                <img src={telegramIcon} alt="" aria-hidden="true" />
              </span>
            </button>
          )}

          <div className="home-welcome-details" aria-live="polite">
            <p className="home-welcome-app-name">RoboticsFund</p>
            <p>Commission : {formatPercent(settings?.level1Commission)}</p>
            <p className="home-welcome-bonus">
              Bonus d’inscription : {formatFcfa(settings?.signupBonus)}
            </p>
            <p>Gains journaliers, {withdrawalHours}</p>
            <p className="home-welcome-minimums">
              <span>Dépôt minimum : {formatFcfa(settings?.minDeposit)}</span>
              <span>Retrait minimum : {formatFcfa(settings?.minWithdrawal)}</span>
            </p>
          </div>

          <DialogPrimitive.Close asChild>
            <button className="home-welcome-confirm" type="button">
              {isLoading ? <Loader2 className="home-welcome-spinner" aria-label="Chargement" /> : "Confirmer"}
            </button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}