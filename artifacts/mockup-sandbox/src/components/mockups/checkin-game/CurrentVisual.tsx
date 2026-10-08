import type { CSSProperties } from "react";
import { ChevronLeft } from "lucide-react";
import "./_group.css";
import "./CurrentVisual.css";

interface CheckinGameVisualProps {
  labels: number[];
  wheelRotationDegrees: number;
  isSpinning: boolean;
  isClaiming: boolean;
  hasClaimedToday: boolean;
  resultAmount: number | null;
  errorMessage: string | null;
  onPlay: () => void;
}

function formatPrize(amount: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
}

export default function CheckinGameVisual({
  labels,
  wheelRotationDegrees,
  isSpinning,
  isClaiming,
  hasClaimedToday,
  resultAmount,
  errorMessage,
  onPlay,
}: CheckinGameVisualProps) {
  const wheelStyle = {
    "--wheel-rotation": `${wheelRotationDegrees}deg`,
    "--wheel-slices": Math.max(labels.length, 1),
    background: labels.length
      ? `conic-gradient(from 0deg, ${labels
          .map((_, index) => {
            const colors = ["#ef6650", "#f0bd58", "#208c7d", "#364c79"];
            const start = (index * 100) / labels.length;
            const end = ((index + 1) * 100) / labels.length;
            return `${colors[index % colors.length]} ${start}% ${end}%`;
          })
          .join(", ")})`
      : "conic-gradient(#ef6650, #f0bd58, #208c7d, #364c79)",
  } as CSSProperties;

  const actionDisabled = isSpinning || isClaiming || hasClaimedToday;
  const actionLabel = hasClaimedToday
    ? "À demain"
    : isClaiming
      ? "Validation du gain…"
      : isSpinning
        ? "La roue tourne…"
        : "Jouer";

  return (
    <main className="fortune-page">
      <div className="fortune-shell">
        <header className="fortune-heading">
          <a
            href="/"
            className="fortune-back"
            aria-label="Retour à l’accueil"
            data-testid="button-back"
          >
            <ChevronLeft aria-hidden="true" />
          </a>
          <p className="fortune-kicker"><span aria-hidden="true" /> Le rendez-vous du jour</p>
          <h1>La roue<br className="fortune-mobile-break" /> de la fortune</h1>
          <p className="fortune-subtitle">Un tour aujourd’hui. Une surprise en FCFA.</p>
        </header>

        <section
          className={`fortune-stage${isSpinning ? " is-spinning" : ""}${hasClaimedToday ? " is-complete" : ""}`}
          aria-label="Jeu de la roue de la fortune"
        >
          <div className="fortune-stage-lights" aria-hidden="true" />
          <div className="fortune-curtain fortune-curtain-left" aria-hidden="true" />
          <div className="fortune-curtain fortune-curtain-right" aria-hidden="true" />
          <div className="fortune-stage-topline" aria-hidden="true">
            <span>ROBOTICS FUND</span><i /><span>CHANCE DU JOUR</span>
          </div>

          <div className="fortune-game">
            <div className="fortune-wheel-area">
              <div className="fortune-wheel-halo" aria-hidden="true" />
              <div className="fortune-wheel-frame">
                <div
                  className={`fortune-wheel${isSpinning ? " wheel-spinning" : ""}`}
                  style={wheelStyle}
                  role="img"
                  aria-label={`Roue de la fortune avec les lots ${labels.map((amount) => `${formatPrize(amount)} FCFA`).join(", ")}`}
                >
                  <div className="fortune-wheel-gloss" aria-hidden="true" />
                  {labels.map((amount, index) => {
                    const sliceAngle = (360 / labels.length) * index;
                    const centerAngle = sliceAngle + 180 / labels.length;
                    return (
                      <span
                        className="fortune-wheel-label"
                        key={`${amount}-${index}`}
                        style={{
                          "--label-angle": `${centerAngle}deg`,
                          "--label-counter-angle": `${-centerAngle}deg`,
                        } as CSSProperties}
                      >
                        <span>{formatPrize(amount)}</span>
                        <small>FCFA</small>
                      </span>
                    );
                  })}
                  <div className="fortune-wheel-hub" aria-hidden="true">
                    <span className="fortune-hub-star" />
                  </div>
                </div>
                <div className="fortune-pointer" aria-hidden="true" />
              </div>
              <p className="fortune-wheel-caption">À vous de jouer</p>
            </div>

            <div className="fortune-mascot-area" aria-hidden="true">
              <span className="fortune-orbit orbit-one" />
              <span className="fortune-orbit orbit-two" />
              <img className="fortune-mascot" src="/__mockup/images/fortune-wheel/fortune-character.jpg" alt="" />
              <span className="fortune-mascot-shadow" />
            </div>
          </div>

          <div className="fortune-stage-floor" aria-hidden="true" />
          <span className="fortune-stage-star star-one" aria-hidden="true">✦</span>
          <span className="fortune-stage-star star-two" aria-hidden="true">✧</span>
          <span className="fortune-stage-star star-three" aria-hidden="true">✦</span>
        </section>

        <section className="fortune-controls" aria-live="polite">
          {hasClaimedToday ? (
            <div className="fortune-result" role="status">
              <div className="fortune-result-mark" aria-hidden="true"><span /></div>
              <div className="fortune-result-copy">
                <p className="fortune-result-eyebrow">Votre tour est joué</p>
                {resultAmount !== null ? (
                  <p className="fortune-result-amount">
                    <strong>{formatPrize(resultAmount)}</strong><span>FCFA</span>
                  </p>
                ) : (
                  <p className="fortune-result-title">La connexion d'aujourd'hui est terminée</p>
                )}
                <p className="fortune-result-note">
                  {resultAmount !== null ? "Votre gain du jour est confirmé." : "La roue vous attend déjà."}
                </p>
              </div>
              <span className="fortune-result-seal" aria-hidden="true">AUJOURD’HUI</span>
            </div>
          ) : (
            <div className="fortune-play-row">
              <p className="fortune-prompt">
                <span className="fortune-prompt-number">01</span>
                <span><strong>Un seul lancer</strong><small>Chaque jour réserve son lot.</small></span>
              </p>
              <button
                className="fortune-play-button"
                type="button"
                onClick={onPlay}
                disabled={actionDisabled}
                aria-busy={isSpinning || isClaiming}
              >
                <span>{actionLabel}</span>
                <span className="fortune-button-arrow" aria-hidden="true">↗</span>
              </button>
            </div>
          )}

          {resultAmount !== null && !hasClaimedToday && (
            <div className="fortune-inline-result" role="status">
              <span>Gain sélectionné</span>
              <strong>{formatPrize(resultAmount)} <small>FCFA</small></strong>
            </div>
          )}
          {errorMessage && <p className="fortune-error" role="alert">{errorMessage}</p>}
        </section>

        <footer className="fortune-footer">
          <span>UN INSTANT. UNE CHANCE. UN GAIN.</span>
          <span className="fortune-footer-divider" aria-hidden="true" />
          <span>Revenez demain.</span>
        </footer>
      </div>
    </main>
  );
}
