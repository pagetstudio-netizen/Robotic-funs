import { ChevronLeft, Menu } from "lucide-react";
import "./_group.css";
import "./LevelDetails.css";

const navItems = [
  { key: "home", label: "Accueil", image: "/__mockup/images/tab-home.png" },
  { key: "product", label: "Produits", image: "/__mockup/images/tab-product.png" },
  { key: "share", label: "Partager", image: "/__mockup/images/tab-share.png" },
  { key: "invite", label: "Inviter", image: "/__mockup/images/tab-invite.png" },
  { key: "account", label: "Compte", image: "/__mockup/images/tab-account.png" },
];

function PreviewBottomNav() {
  return (
    <nav className="team-preview-nav" aria-label="Navigation principale">
      {navItems.map((item) => {
        const selected = item.key === "home";
        return (
          <button key={item.key} type="button" className="team-preview-nav-item">
            <img
              src={item.image}
              alt=""
              aria-hidden="true"
              style={{
                filter: selected
                  ? "none"
                  : "grayscale(1) brightness(.62)",
              }}
            />
            <span className={selected ? "is-active" : ""}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function LevelDetails() {
  return (
    <div className="team-preview-screen">
      <main className="team-details-page">
        <header className="team-details-header">
          <button type="button" className="team-details-back">
            <ChevronLeft aria-hidden="true" />
            <span>Retour</span>
          </button>
          <h1>Détails de l'équipe LV2</h1>
        </header>

        <section className="team-details-cards" aria-label="Recharges du jour">
          <article className="team-details-stat-card">
            <Menu className="team-details-card-menu" aria-hidden="true" />
            <span className="team-details-stat-label">Recharge du jour</span>
            <strong className="team-details-stat-value">0,00 <small>FCFA</small></strong>
            <time className="team-details-stat-date">07-10-2026</time>
          </article>
          <article className="team-details-stat-card">
            <Menu className="team-details-card-menu" aria-hidden="true" />
            <span className="team-details-stat-label">Nombre de recharges</span>
            <strong className="team-details-stat-value">0</strong>
            <time className="team-details-stat-date">07-10-2026</time>
          </article>
        </section>

        <section className="team-details-members">
          <p className="team-details-message">Plus de données</p>
        </section>
      </main>
      <PreviewBottomNav />
    </div>
  );
}
