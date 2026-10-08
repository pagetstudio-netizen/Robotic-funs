import { useState } from "react";
import { X } from "lucide-react";
import "./_group.css";
import "./ReferenceMatch.css";

export function ReferenceMatch() {
  const [open, setOpen] = useState(true);

  return (
    <main className="popup-mockup-page">
      <div className="mockup-home-backdrop" aria-hidden="true">
        <div className="mockup-home-banner">Des cadeaux de luxe vous attendent</div>
        <div className="mockup-home-shortcuts">
          <span /><span /><span /><span />
        </div>
        <div className="mockup-home-products">
          <div className="mockup-home-product" />
          <div className="mockup-home-product" />
        </div>
        <nav className="mockup-home-nav">
          <span>Maison</span><span>Produit</span><span>Partager</span><span>Inviter</span><span>Mon</span>
        </nav>
      </div>

      {open && (
        <>
          <div className="reference-welcome-overlay" />
          <section
            className="reference-welcome-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenue chez RoboticsFund"
          >
            <div className="reference-welcome-stage">
              <div className="reference-welcome-card" aria-hidden="true" />
              <img
                className="reference-welcome-illustration"
                src="/__mockup/images/welcome-robot.png"
                alt=""
                aria-hidden="true"
              />
              <div className="reference-welcome-body">
                <div className="reference-welcome-details">
                  <p className="reference-welcome-app-name">Bienvenue chez <strong>RoboticsFund&nbsp;!</strong></p>
                  <p><span>Bonus d’inscription&nbsp;:</span> <strong>500 FCFA</strong></p>
                  <p><span>Dépôt minimum&nbsp;:</span> <strong>3 000 FCFA</strong></p>
                  <p><span>Retrait minimum&nbsp;:</span> <strong>1 500 FCFA</strong></p>
                  <p>Tâches et roue chanceux</p>
                </div>
              </div>
              <a className="reference-welcome-telegram" href="#official-group" aria-label="Groupe officiel">
                <span className="reference-welcome-telegram-icon" aria-hidden="true">
                  <img src="/__mockup/images/telegram-mark.png" alt="" />
                </span>
                <span className="reference-welcome-telegram-label">Groupe officiel</span>
              </a>
              <button className="reference-welcome-close" type="button" aria-label="Fermer" onClick={() => setOpen(false)}>
                <X aria-hidden="true" />
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
