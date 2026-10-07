import { MessagesSquare, Power } from "lucide-react";
import "./_group.css";

const menuItems = [
  { label: "Changer le mot de passe", lines: ["Changer", "le mot de", "passe"], image: "password.png" },
  { label: "Ma carte bancaire", lines: ["Ma", "carte bancaire"], image: "bank-card.png" },
  { label: "Relevé de solde", lines: ["Relevé de solde"], image: "statement.png" },
  { label: "Contactez-nous", lines: ["Contactez", "-nous"], icon: "contact" },
  { label: "À propos de nous", lines: ["À propos", "de nous"], image: "about.png" },
  { label: "Trésor", lines: ["Trésor"], image: "treasure.png" },
  { label: "Télécharger l'application", lines: ["Télécharger", "l'application"], image: "download.png" },
  { label: "Se déconnecter", lines: ["Se déconnecter"], icon: "power" },
];

export function AccountReference() {
  return (
    <div className="account-preview-page">
      <main className="account-page">
        <div className="account-shell">
          <section className="account-stage" aria-label="Mon compte">
            <div className="account-card">
              <img
                className="account-card-art"
                src="/__mockup/account/card-robot.png"
                alt=""
                aria-hidden="true"
              />
              <div className="account-card-shade" aria-hidden="true" />
              <div className="account-card-content">
                <div className="account-balance-pill">
                  <span className="account-phone">9142383341</span>
                  <span className="account-balance">Solde actuel : 45 FCFA</span>
                </div>
                <div className="account-shortcuts" aria-label="Opérations du compte">
                  <button type="button">
                    <img src="/__mockup/account/deposit.png" alt="" aria-hidden="true" />
                    <span>Recharger</span>
                  </button>
                  <button type="button">
                    <img src="/__mockup/account/withdraw.png" alt="" aria-hidden="true" />
                    <span>Retirer</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="account-brand-mark" aria-hidden="true">
              <img src="/__mockup/account/logo.jpg" alt="" />
            </div>
          </section>

          <nav className="account-menu" aria-label="Services du compte">
            <div className="account-menu-grid">
              {menuItems.map(({ label, lines, image, icon }) => (
                <button
                  key={label}
                  type="button"
                  className="account-menu-item"
                  aria-label={label}
                >
                  <span
                    className={`account-menu-icon${icon === "contact" ? " is-contact" : ""}${icon === "power" ? " is-power" : ""}`}
                    aria-hidden="true"
                  >
                    {image ? (
                      <img src={`/__mockup/account/${image}`} alt="" />
                    ) : icon === "contact" ? (
                      <MessagesSquare />
                    ) : (
                      <Power />
                    )}
                  </span>
                  <span className="account-menu-label">
                    {lines.map((line) => <span key={line}>{line}</span>)}
                  </span>
                </button>
              ))}
            </div>
            <div className="account-menu-divider" aria-hidden="true" />
          </nav>
        </div>
      </main>
      <img
        className="account-preview-nav"
        src="/__mockup/account/reference-nav.png"
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}
