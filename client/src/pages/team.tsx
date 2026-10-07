import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getCountryByCode } from "@/lib/countries";
import { useLocation } from "wouter";
import { ChevronRight, UsersRound } from "lucide-react";
import { ROBOTICSFUND_LOGO } from "@/lib/john-deere-assets";
import groupIcon from "@assets/groupe_1790677429988.png";
import copyIcon from "@assets/copie_1790677430042.png";
import "./team.css";

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCommission: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
  level1Invested: number;
  level2Invested: number;
  level3Invested: number;
}

const formatWholeNumber = (value: number) =>
  Math.round(Number(value) || 0).toLocaleString("fr-FR");
const formatPercent = (value: number) =>
  Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: stats } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  if (!user) return null;

  const countryInfo = getCountryByCode(user.country);
  const currency = countryInfo?.currency === "FCFA" ? "XOF" : countryInfo?.currency || "XOF";
  const referralUrl = new URL("/invitation", window.location.origin);
  referralUrl.searchParams.set("code", user.referralCode);
  const referralLink = referralUrl.toString();
  const totalPeople =
    (stats?.level1Count || 0) +
    (stats?.level2Count || 0) +
    (stats?.level3Count || 0);

  const copyValue = async (value: string, title: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title });
    } catch {
      toast({
        title: "Copie impossible",
        description: "Autorisez l'accès au presse-papiers puis réessayez.",
        variant: "destructive",
      });
    }
  };

  const levelRows = [
    {
      level: 1 as const,
      rate: Number(settings?.level1Commission ?? 27),
      users: stats?.level1Count || 0,
      activeUsers: stats?.level1Invested || 0,
      commission: stats?.level1Commission || 0,
    },
    {
      level: 2 as const,
      rate: Number(settings?.level2Commission ?? 2),
      users: stats?.level2Count || 0,
      activeUsers: stats?.level2Invested || 0,
      commission: stats?.level2Commission || 0,
    },
    {
      level: 3 as const,
      rate: Number(settings?.level3Commission ?? 1),
      users: stats?.level3Count || 0,
      activeUsers: stats?.level3Invested || 0,
      commission: stats?.level3Commission || 0,
    },
  ];

  const exampleAmount = 10_000;
  const exampleEarnings = (rate: number, invitees: number) =>
    formatWholeNumber((exampleAmount * rate * invitees) / 100);

  return (
    <main className="team-page">
      <div className="team-page-shell">
        <header className="team-header">
          <img
            className="team-header-image"
            src={ROBOTICSFUND_LOGO}
            alt=""
            aria-hidden="true"
          />
          <h1>Équipe</h1>
        </header>

        <section className="team-summary" aria-label="Résumé de l'équipe">
          <div className="team-summary-item">
            <span>Membres totaux</span>
            <strong data-testid="text-total-team-members">{formatWholeNumber(totalPeople)}</strong>
          </div>
          <div className="team-summary-divider" aria-hidden="true" />
          <div className="team-summary-item">
            <span>Commission totale</span>
            <strong data-testid="text-total-team-commission">
              {formatWholeNumber(stats?.totalCommission || 0)} {currency}
            </strong>
          </div>
        </section>

        <section className="team-invite-card" aria-label="Inviter des amis">
          <h2>Inviter des amis</h2>
          <div className="team-invite-row">
            <span className="team-invite-icon" aria-hidden="true">
              <UsersRound />
            </span>
            <div className="team-invite-copy">
              <span>Code d’invitation</span>
              <strong data-testid="text-referral-code">{user.referralCode}</strong>
            </div>
            <button
              className="team-copy-button"
              type="button"
              onClick={() => copyValue(user.referralCode, "Code copié !")}
              data-testid="button-copy-code"
            >
              <img src={copyIcon} alt="" aria-hidden="true" />
              Copier
            </button>
          </div>
          <div className="team-invite-row team-invite-row-link">
            <span className="team-invite-icon" aria-hidden="true">
              <img src={groupIcon} alt="" />
            </span>
            <div className="team-invite-copy">
              <span>Lien d’invitation</span>
              <strong data-testid="text-referral-link">{referralLink}</strong>
            </div>
            <button
              className="team-copy-button"
              type="button"
              onClick={() => copyValue(referralLink, "Lien copié !")}
              data-testid="button-copy-link"
            >
              <img src={copyIcon} alt="" aria-hidden="true" />
              Copier
            </button>
          </div>
        </section>

        <section className="team-levels-section" aria-labelledby="team-levels-title">
          <h2 id="team-levels-title" className="team-section-title">
            Informations de l’équipe
          </h2>
          <div className="team-level-list">
            {levelRows.map((level) => (
              <article className="team-level-card" key={level.level} data-testid={`vip-row-${level.level}`}>
                <div className="team-level-heading">
                  <h3>Niveau {level.level}</h3>
                  <button
                    type="button"
                    className="team-level-more"
                    onClick={() => navigate(`/team-details?level=${level.level}`)}
                    aria-label={`Voir les membres de l'équipe niveau ${level.level}`}
                    data-testid={`button-team-level-${level.level}`}
                  >
                    Détails
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
                <div className="team-level-metrics">
                  <div className="team-level-metric">
                    <strong data-testid={`text-level${level.level}-count`}>
                      {formatWholeNumber(level.users)}/{formatWholeNumber(level.activeUsers)}
                    </strong>
                    <span>Inscrit/Actif</span>
                  </div>
                  <div className="team-level-metric team-level-revenue">
                    <strong data-testid={`text-level${level.level}-commission`}>
                      {formatWholeNumber(level.commission)} {currency}
                    </strong>
                    <span>Revenu total</span>
                  </div>
                </div>
                <div className="team-level-rate">
                  <strong>{formatPercent(level.rate)}%</strong>
                  <span>Taux de commission</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="team-rules" aria-labelledby="team-rules-title">
          <h2 id="team-rules-title" className="team-section-title">
            Règles
          </h2>
          <p className="team-rules-intro">
            <span className="team-rule-emoji" aria-hidden="true">💡</span>
            Notre système de commissions comporte trois niveaux de parrainage :
          </p>
          <ul className="team-rate-list">
            {levelRows.map((level) => (
              <li key={level.level}>
                <span className="team-rule-dot" aria-hidden="true" />
                Niveau {level.level} : <strong>{formatWholeNumber(level.rate)}%</strong>
              </li>
            ))}
          </ul>
          <h3 className="team-examples-title">
            <span aria-hidden="true">💰</span>
            Exemples de gains
          </h3>
          <ul className="team-examples-list">
            {levelRows.map((level) => {
              const invitees = level.level === 1 ? 1 : level.level === 2 ? 10 : 100;
              return (
                <li key={level.level}>
                  <span className="team-example-emoji" aria-hidden="true">
                    {level.level === 1 ? "🤝" : level.level === 2 ? "👥" : "🌟"}
                  </span>
                  <span className="team-example-copy">
                    Invitez {invitees} {invitees === 1 ? "ami" : "amis"} à investir{" "}
                    {formatWholeNumber(exampleAmount)} francs CFA chacun : vous pouvez gagner environ{" "}
                    <strong>{exampleEarnings(level.rate, invitees)} francs CFA</strong> au niveau {level.level}.
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="team-rules-note">
            Vous recevez une commission de {formatWholeNumber(levelRows[0].rate)}% sur les investissements de vos
            amis. Les commissions des niveaux 2 et 3 s’appliquent aux investissements de leur équipe.
          </p>
          <p className="team-rules-highlight">
            <span aria-hidden="true">📈</span>
            Plus vous invitez d’amis et plus ils participent, plus votre commission peut augmenter.
          </p>
        </section>
      </div>
    </main>
  );
}