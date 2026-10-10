import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import telegramIcon from "@assets/telegram_(2)_1791501754806.png";
import welcomeRobot from "@assets/file_000000004d8081f4bc975fdd26cf35e2_1791499669048.png";
import "./home-welcome-popup.css";

interface HomePopupSettings {
  groupLink?: string;
  popupButtonLabel?: string;
  level1Commission?: string;
  minDeposit?: string;
  minWithdrawal?: string;
  withdrawalStartHour?: string;
  withdrawalEndHour?: string;
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
  const rate = Number(value ?? "27");
  return Number.isFinite(rate)
    ? `${rate.toLocaleString("fr-FR")} %`
    : "— %";
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
  const canJoinGroup = Boolean(groupUrl);
  const joinLabel = settings?.popupButtonLabel?.trim() || "Groupe officiel";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="home-welcome-overlay" />
        <DialogPrimitive.Content
          className="home-welcome-dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="home-welcome-stage" aria-busy={isLoading}>
            <div className="home-welcome-card" aria-hidden="true" />
            <img
              className="home-welcome-illustration"
              src={welcomeRobot}
              alt=""
              aria-hidden="true"
            />

            <div className="home-welcome-body">
              <DialogPrimitive.Title className="sr-only">
                Bienvenue chez RoboticsFund
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Informations de la plateforme et lien du groupe Telegram.
              </DialogPrimitive.Description>

              <div className="home-welcome-details" aria-live="polite">
                <p className="home-welcome-app-name">
                  Bienvenue chez <strong>RoboticsFund&nbsp;!</strong>
                </p>
                <p>
                  <span>Commission de recommandation&nbsp;:</span>{" "}
                  <strong>{formatPercent(settings?.level1Commission)}</strong>
                </p>
                <p>
                  <span>Dépôt minimum&nbsp;:</span>{" "}
                  <strong>{formatFcfa(settings?.minDeposit)}</strong>
                </p>
                <p>
                  <span>Retrait minimum&nbsp;:</span>{" "}
                  <strong>{formatFcfa(settings?.minWithdrawal)}</strong>
                </p>
                <p>Tâches et roue chanceux</p>
              </div>
            </div>

            {canJoinGroup ? (
              <a
                className="home-welcome-telegram"
                href={groupUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={joinLabel}
              >
                <span className="home-welcome-telegram-icon" aria-hidden="true">
                  <img src={telegramIcon} alt="" />
                </span>
                <span className="home-welcome-telegram-label">{joinLabel}</span>
              </a>
            ) : (
              <button
                className="home-welcome-telegram is-unavailable"
                type="button"
                disabled
                aria-label="Groupe officiel, lien non configuré"
                title="Le lien du groupe Telegram n’est pas configuré"
              >
                <span className="home-welcome-telegram-icon" aria-hidden="true">
                  <img src={telegramIcon} alt="" />
                </span>
                <span className="home-welcome-telegram-label">Groupe officiel</span>
              </button>
            )}

            <DialogPrimitive.Close asChild>
              <button className="home-welcome-close" type="button" aria-label="Fermer">
                <X aria-hidden="true" />
              </button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}