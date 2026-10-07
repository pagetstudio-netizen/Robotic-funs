import { useState } from "react";
import "./_group.css";
import "./InviteReference.css";

const robotImage = "/__mockup/images/invitation-robot.png";

const tiers = [
  { reward: 60, members: 3, className: "tier-peach" },
  { reward: 180, members: 9, className: "tier-yellow" },
  { reward: 540, members: 18, className: "tier-orange" },
  { reward: 1080, members: 36, className: "tier-coral" },
  { reward: 2880, members: 72, className: "tier-red" },
  { reward: 5760, members: 144, className: "tier-crimson" },
  { reward: 17280, members: 288, className: "tier-crimson" },
];

const navigation = [
  { label: "Accueil", image: "/__mockup/images/tab-home.png" },
  { label: "Produits", image: "/__mockup/images/tab-products.png" },
  { label: "Partager", image: "/__mockup/images/tab-share.png" },
  { label: "Inviter", image: "/__mockup/images/tab-invite.png" },
  { label: "Compte", image: "/__mockup/images/tab-account.png" },
];

function formatFcfa(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

export function InviteReference() {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copy = async (value: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1300);
    } catch {
      setCopied(null);
    }
  };

  return (
    <main className="invite-reference-preview">
      <div className="invite-reference-scroll">
        <header className="invite-reference-header">
          <h1>Récompenses d&apos;invitation</h1>
          <img className="invite-reference-hero-robot" src={robotImage} alt="" />

          <section className="invite-reference-code-panel" aria-label="Informations d'invitation">
            <div className="invite-reference-code-row">
              <div className="invite-reference-code-copy">
                <span className="invite-reference-label">Code d&apos;invitation</span>
                <strong>b083e2f2</strong>
              </div>
              <button
                className="invite-reference-copy-button"
                type="button"
                onClick={() => void copy("b083e2f2", "code")}
                aria-label="Copier le code d'invitation"
              >
                {copied === "code" ? "Copié" : "Copie"}
              </button>
            </div>
            <div className="invite-reference-code-row invite-reference-link-row">
              <div className="invite-reference-code-copy">
                <span className="invite-reference-label">Copier le lien</span>
                <strong className="invite-reference-url">https://b-roboticsfun...</strong>
              </div>
              <button
                className="invite-reference-copy-button"
                type="button"
                onClick={() => void copy("https://b-roboticsfun.one", "link")}
                aria-label="Copier le lien d'invitation"
              >
                {copied === "link" ? "Copié" : "Copie"}
              </button>
            </div>
          </section>
        </header>

        <section className="invite-reference-tiers" aria-label="Paliers de récompense">
          {tiers.map((tier) => (
            <article className={`invite-reference-tier ${tier.className}`} key={tier.reward}>
              <img className="invite-reference-watermark" src={robotImage} alt="" />
              <div className="invite-reference-tier-content">
                <strong className="invite-reference-reward">{formatFcfa(tier.reward)}</strong>
                <h2>Tâche d&apos;invitation</h2>
                <p>Invitez {tier.members} membres de niveau 1 à investir</p>
                <span className="invite-reference-status">Inachevé</span>
                <span className="invite-reference-progress">
                  Progression : 0/{tier.members}
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>

      <nav className="invite-reference-nav" aria-label="Navigation principale">
        {navigation.map(({ label, image }) => (
          <div
            className={`invite-reference-nav-item ${label === "Inviter" ? "is-active" : ""}`}
            key={label}
          >
            <img src={image} alt="" />
            <span>{label}</span>
          </div>
        ))}
      </nav>
    </main>
  );
}
