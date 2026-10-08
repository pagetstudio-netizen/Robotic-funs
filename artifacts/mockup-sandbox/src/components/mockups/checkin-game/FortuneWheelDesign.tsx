import type { CSSProperties } from "react";
import { ChevronLeft } from "lucide-react";
import "./FortuneWheelDesign.css";

const DEMO_PRIZES = [100, 200, 300, 500, 1500, 5000, 7000, 30000, 35000];
const WHEEL_COLORS = ["#2458a3", "#80a6e9"];

interface FortuneWheelDesignProps {
  labels?: number[];
  wheelRotationDegrees?: number;
  isSpinning?: boolean;
  isClaiming?: boolean;
  hasClaimedToday?: boolean;
  resultAmount?: number | null;
  errorMessage?: string | null;
  onPlay?: () => void;
}

function formatPrize(amount: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
    .format(amount)
    .replace(/[\u202f\u00a0]/g, "\u00a0");
}

export default function FortuneWheelDesign({
  labels = DEMO_PRIZES,
  wheelRotationDegrees = 0,
  isSpinning = false,
  isClaiming = false,
  hasClaimedToday = false,
  resultAmount = null,
  errorMessage = null,
  onPlay,
}: FortuneWheelDesignProps) {
  const sliceAngle = labels.length ? 360 / labels.length : 360;
  const wheelBackground = labels.length
    ? `conic-gradient(from 0deg, ${labels
        .map((_, index) => {
          const start = index * sliceAngle;
          const end = (index + 1) * sliceAngle;
          return `${WHEEL_COLORS[index % WHEEL_COLORS.length]} ${start}deg ${end}deg`;
        })
        .join(", ")})`
    : "conic-gradient(#2458a3, #80a6e9, #2458a3)";
  const wheelStyle = {
    "--wheel-rotation": `${wheelRotationDegrees}deg`,
    "--wheel-background": wheelBackground,
  } as CSSProperties;
  const actionDisabled = isSpinning || isClaiming || hasClaimedToday;
  const actionDescription = hasClaimedToday
    ? "Votre tour du jour est terminé"
    : isClaiming
      ? "Confirmation du gain en cours"
      : isSpinning
        ? "La roue tourne"
        : "Jouer à la roue de la fortune";
  const statusMessage = isClaiming
    ? "Confirmation du gain…"
    : isSpinning
      ? "La roue tourne…"
      : "";

  return (
    <main className="fortune-redesign">
      <div className="fortune-redesign__shell">
        <header className="fortune-redesign__intro">
          <a
            href="/"
            className="fortune-redesign__back"
            aria-label="Retour à l’accueil"
            data-testid="button-back"
          >
            <ChevronLeft aria-hidden="true" />
          </a>
          <p>Un tour aujourd’hui pour tenter de gagner des FCFA.</p>
        </header>

        <section
          className={`fortune-redesign__stage${isSpinning ? " is-spinning" : ""}${isClaiming ? " is-claiming" : ""}`}
          aria-label="Jeu de la roue de la fortune"
        >
          <div className="fortune-redesign__wheel-side">
            <div className="fortune-redesign__wheel-frame">
              <div
                className={`fortune-redesign__wheel${!isSpinning && !isClaiming && !hasClaimedToday ? " is-idle" : ""}`}
                style={wheelStyle}
                role="group"
                aria-label={`Roue avec ${labels.map((amount) => `${formatPrize(amount)} FCFA`).join(", ")}`}
              >
                <img
                  className="fortune-redesign__coin-art fortune-redesign__coin-art--one"
                  src="/__mockup/images/fortune-wheel/coin-stack-1.png"
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="fortune-redesign__coin-art fortune-redesign__coin-art--two"
                  src="/__mockup/images/fortune-wheel/coin-stack-2.png"
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="fortune-redesign__coin-art fortune-redesign__coin-art--three"
                  src="/__mockup/images/fortune-wheel/coin-stack-2.png"
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="fortune-redesign__coin-art fortune-redesign__coin-art--four"
                  src="/__mockup/images/fortune-wheel/coin-stack-1.png"
                  alt=""
                  aria-hidden="true"
                />
                {labels.map((amount, index) => {
                  const centerAngle = sliceAngle * (index + 0.5);
                  return (
                    <span
                      className="fortune-redesign__label"
                      key={`${amount}-${index}`}
                      style={
                        {
                          "--label-angle": `${centerAngle}deg`,
                          "--label-counter-angle": `${-centerAngle}deg`,
                        } as CSSProperties
                      }
                    >
                      <span className="fortune-redesign__label-content">
                        <span>{formatPrize(amount)}</span>
                        <small>FCFA</small>
                      </span>
                    </span>
                  );
                })}
              </div>
              <img
                className="fortune-redesign__rim"
                src="/__mockup/images/fortune-wheel/metal-rim.png"
                alt=""
                aria-hidden="true"
              />
                <button
                  className={`fortune-redesign__go${hasClaimedToday ? " is-claimed" : ""}`}
                  type="button"
                  onClick={() => onPlay?.()}
                  disabled={actionDisabled}
                  aria-label={actionDescription}
                  aria-busy={isSpinning || isClaiming}
                >
                  <img
                    src="/__mockup/images/fortune-wheel/go-button.png"
                    alt=""
                    aria-hidden="true"
                  />
                </button>
            </div>

            <div className="fortune-redesign__status-wrap" aria-live="polite" role="status">
              <p className="fortune-redesign__status">
                {hasClaimedToday ? "La connexion d'aujourd'hui est terminée" : statusMessage}
              </p>
              {hasClaimedToday && resultAmount !== null && (
                <p className="fortune-redesign__result">
                  Gain confirmé : <strong>{formatPrize(resultAmount)} FCFA</strong>
                </p>
              )}
            </div>
          </div>

          {errorMessage && !hasClaimedToday && (
            <p className="fortune-redesign__error" role="alert">
              {errorMessage}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
