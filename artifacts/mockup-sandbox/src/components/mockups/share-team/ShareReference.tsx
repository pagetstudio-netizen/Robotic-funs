import { useState } from "react";
import "./_group.css";
import "./ShareReference.css";

type TeamLevel = 1 | 2 | 3;

const navItems = [
  { key: "home", label: "Accueil", image: "/__mockup/images/tab-home.png" },
  { key: "product", label: "Produits", image: "/__mockup/images/tab-product.png" },
  { key: "share", label: "Partager", image: "/__mockup/images/tab-share.png" },
  { key: "invite", label: "Inviter", image: "/__mockup/images/tab-invite.png" },
  { key: "account", label: "Compte", image: "/__mockup/images/tab-account.png" },
];

function PreviewBottomNav({ active }: { active: string }) {
  return (
    <nav className="team-preview-nav" aria-label="Navigation principale">
      {navItems.map((item) => {
        const selected = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            className="team-preview-nav-item"
            aria-current={selected ? "page" : undefined}
          >
            <img
              src={item.image}
              alt=""
              aria-hidden="true"
              style={{
                filter: selected
                  ? item.key === "home"
                    ? "none"
                    : "brightness(0) saturate(100%) invert(79%) sepia(48%) saturate(710%) hue-rotate(4deg) brightness(101%) contrast(96%)"
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

export function ShareReference() {
  const [activeLevel, setActiveLevel] = useState<TeamLevel>(1);
  const rates: Record<TeamLevel, string> = { 1: "30%", 2: "2%", 3: "1%" };

  return (
    <div className="team-preview-screen">
      <main className="team-page">
        <div className="team-page-shell">
          <section className="team-overview" aria-label="Résumé de l'équipe">
            <div className="team-overview-item">
              <span>Revenus de l'équipe</span>
              <strong>0,00 FCFA</strong>
            </div>
            <div className="team-overview-item team-overview-item-centered">
              <span>Taille de l'équipe</span>
              <strong>0</strong>
            </div>
            <div className="team-overview-item team-overview-item-right">
              <span>Recharge d'équipe</span>
              <strong>0 FCFA</strong>
            </div>
          </section>

          <div className="team-level-switcher" role="tablist" aria-label="Niveaux de l’équipe">
            {([1, 2, 3] as TeamLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                role="tab"
                aria-selected={activeLevel === level}
                className={`team-level-tab${activeLevel === level ? " is-active" : ""}`}
                onClick={() => setActiveLevel(level)}
              >
                niveau {level}
              </button>
            ))}
          </div>

          <section className="team-active-summary">
            <div className="team-active-metrics">
              <span>Revenu (FCFA) : <strong>0,00</strong></span>
              <span>Recharge (FCFA) : <strong>0</strong></span>
            </div>
            <p className="team-active-count">Tous 0</p>
          </section>

          <button type="button" className="team-rate-banner" aria-label="Voir les détails du niveau sélectionné">
            <img className="team-rate-robot" src="/__mockup/images/share-robot.png" alt="" />
            <span className="team-rate-copy">
              <strong>{rates[activeLevel]}</strong>
              <span>Taux</span>
            </span>
          </button>
        </div>
      </main>
      <PreviewBottomNav active="share" />
    </div>
  );
}
