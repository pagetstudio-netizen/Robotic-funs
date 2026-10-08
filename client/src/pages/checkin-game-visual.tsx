import { useEffect, type CSSProperties } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import "./checkin-game-visual.css";

interface CheckinGameVisualProps {
  labels: number[];
  wheelRotationDegrees: number;
  isSpinning: boolean;
  isClaiming: boolean;
  availableSpins: number;
  resultAmount: number | null;
  isLossResult: boolean;
  resultMessage: string | null;
  isNoSpinsModalOpen: boolean;
  errorMessage: string | null;
  onDismissNoSpins: () => void;
  onDismissResult: () => void;
  onPlay: () => void;
}

function formatPrize(amount: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
    .format(amount)
    .replace(/[\u202f\u00a0]/g, "\u00a0");
}

const WHEEL_COLORS = ["#2458a3", "#80a6e9"];

export default function CheckinGameVisual({
  labels,
  wheelRotationDegrees,
  isSpinning,
  isClaiming,
  availableSpins,
  resultAmount,
  isLossResult,
  resultMessage,
  isNoSpinsModalOpen,
  errorMessage,
  onDismissNoSpins,
  onDismissResult,
  onPlay,
}: CheckinGameVisualProps) {
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

  const hasFreeSpins = availableSpins > 0;
  const actionDisabled = isSpinning || isClaiming;
  const actionDescription = !hasFreeSpins
    ? "Afficher les informations pour obtenir un tour de roue gratuit"
    : isClaiming
      ? "Confirmation du gain en cours"
      : isSpinning
        ? "La roue tourne"
        : `Jouer à la roue de la fortune, ${availableSpins} tour(s) gratuit(s) disponible(s)`;
  const statusMessage = isClaiming
    ? "Le serveur confirme le tirage…"
    : isSpinning
      ? "La roue tourne…"
      : hasFreeSpins
        ? `${availableSpins} tour${availableSpins === 1 ? "" : "s"} gratuit${availableSpins === 1 ? "" : "s"} disponible${availableSpins === 1 ? "" : "s"}`
        : null;
  const dialogKind =
    resultAmount !== null || isLossResult
      ? "result"
      : isNoSpinsModalOpen
        ? "no-spins"
        : null;
  const dismissDialog = dialogKind === "result" ? onDismissResult : onDismissNoSpins;

  useEffect(() => {
    if (!dialogKind) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      document.getElementById("fortune-wheel-dialog-close")?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissDialog();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dialogKind, dismissDialog]);

  return (
    <main className="fortune-redesign">
      <div className="fortune-redesign__shell">
        <header className="fortune-redesign__intro">
          <Link
            href="/"
            className="fortune-redesign__back"
            aria-label="Retour à l’accueil"
            data-testid="button-back"
          >
            <ChevronLeft aria-hidden="true" />
            <span>Retour</span>
          </Link>
        </header>

        <section
          className={`fortune-redesign__stage${isSpinning ? " is-spinning" : ""}${isClaiming ? " is-claiming" : ""}`}
          aria-label="Jeu de la roue de la fortune"
        >
          <div className="fortune-redesign__wheel-side">
            <div className="fortune-redesign__wheel-frame">
              <div
                className={`fortune-redesign__wheel${!isSpinning && !isClaiming ? " is-idle" : ""}`}
                style={wheelStyle}
                role="group"
                aria-label={`Roue avec ${labels.map((amount) => `${formatPrize(amount)} FCFA`).join(", ")}`}
              >
                <img
                  className="fortune-redesign__coin-art fortune-redesign__coin-art--one"
                  src="/fortune-wheel/coin-stack-1.png"
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="fortune-redesign__coin-art fortune-redesign__coin-art--two"
                  src="/fortune-wheel/coin-stack-2.png"
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="fortune-redesign__coin-art fortune-redesign__coin-art--three"
                  src="/fortune-wheel/coin-stack-2.png"
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="fortune-redesign__coin-art fortune-redesign__coin-art--four"
                  src="/fortune-wheel/coin-stack-1.png"
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
                src="/fortune-wheel/metal-rim.png"
                alt=""
                aria-hidden="true"
              />
              <button
                className={`fortune-redesign__go${!hasFreeSpins ? " is-unavailable" : ""}`}
                type="button"
                onClick={onPlay}
                disabled={actionDisabled}
                aria-label={actionDescription}
                aria-busy={isSpinning || isClaiming}
                aria-haspopup="dialog"
              >
                <img src="/fortune-wheel/go-button.png" alt="" aria-hidden="true" />
              </button>
            </div>
            <div className="fortune-redesign__status-wrap" aria-live="polite" role="status">
              {statusMessage ? (
                <p className="fortune-redesign__status">{statusMessage}</p>
              ) : (
                <div className="fortune-redesign__status-copy">
                  <p>Chaque investissement réussi vous donne droit à une participation au tirage au sort.</p>
                  <p>Si vous parvenez à inviter un utilisateur à s'inscrire, vous gagnez un tour de roue chanceux</p>
                </div>
              )}
              {isLossResult ? (
                <p className="fortune-redesign__result">
                  Aucun gain sur ce tour.
                </p>
              ) : resultAmount !== null ? (
                <p className="fortune-redesign__result">
                  Gain confirmé : <strong>{formatPrize(resultAmount)} FCFA</strong>
                </p>
              ) : null}
            </div>
          </div>

          {errorMessage && (
            <p className="fortune-redesign__error" role="alert">
              {errorMessage}
            </p>
          )}
        </section>
      </div>
      {dialogKind && (
        <div className="fortune-wheel-modal-backdrop">
          <section
            className="fortune-wheel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fortune-wheel-dialog-title"
            aria-describedby="fortune-wheel-dialog-description"
          >
            <div className="fortune-wheel-modal__content">
              <h2 id="fortune-wheel-dialog-title">
                {dialogKind === "result"
                  ? isLossResult
                    ? "Aucun gain cette fois"
                    : "Succès"
                  : "Aucun tour disponible"}
              </h2>
              {dialogKind === "result" ? (
                <>
                  <p id="fortune-wheel-dialog-description" className="fortune-wheel-modal__message">
                    {resultMessage ||
                      (isLossResult
                        ? "Désolé, vous n'avez rien gagné cette fois-ci."
                        : `Vous avez gagné ${formatPrize(resultAmount ?? 0)} FCFA !`)}
                  </p>
                  <p className="fortune-wheel-modal__detail">
                    {isLossResult
                      ? "La roue s'est arrêtée entre les montants. Aucun montant n'a été crédité."
                      : "Votre gain a été crédité sur votre solde de dépôt."}
                  </p>
                </>
              ) : (
                <>
                  <p id="fortune-wheel-dialog-description" className="fortune-wheel-modal__message">
                    Vous n'avez pas de tour gratuit disponible pour le moment.
                  </p>
                  <p className="fortune-wheel-modal__detail">
                    Chaque investissement réussi vous donne droit à une participation au tirage au sort.
                  </p>
                  <p className="fortune-wheel-modal__detail">
                    Si vous parvenez à inviter un utilisateur à s'inscrire, vous gagnez un tour de roue chanceux
                  </p>
                </>
              )}
            </div>
            <div className="fortune-wheel-modal__footer">
              <button
                id="fortune-wheel-dialog-close"
                type="button"
                onClick={dismissDialog}
                autoFocus
              >
                D’ACCORD
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
