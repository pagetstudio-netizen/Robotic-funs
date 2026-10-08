import { useState } from "react";
import "./_group.css";
import "./Current.css";

export function Current() {
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
          <div className="home-welcome-overlay" />
          <section className="home-welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="current-popup-title">
            <h2 id="current-popup-title" className="home-welcome-title">RoboticsFund</h2>
            <img
              className="home-welcome-illustration"
              src="/__mockup/images/old-welcome-illustration.png"
              alt=""
            />
            <p className="sr-only">Informations de la plateforme et lien du groupe Telegram.</p>
            <a className="home-welcome-telegram" href="#group">
              <span className="home-welcome-telegram-label">Cliquez ici pour rejoindre le groupe Telegram</span>
              <span className="home-welcome-telegram-icon">
                <img src="/__mockup/images/old-telegram.png" alt="" />
              </span>
            </a>
            <div className="home-welcome-details">
              <p className="home-welcome-app-name">RoboticsFund</p>
              <p>Commission : 25%</p>
              <p className="home-welcome-bonus">Bonus d’inscription : 500 FCFA</p>
              <p>Gains journaliers, retraits de 9 h à 17 h</p>
              <p className="home-welcome-minimums">
                <span>Dépôt minimum : 3 000 FCFA</span>
                <span>Retrait minimum : 1 500 FCFA</span>
              </p>
            </div>
            <button className="home-welcome-confirm" onClick={() => setOpen(false)}>
              Confirmer
            </button>
          </section>
        </>
      )}
    </main>
  );
}
