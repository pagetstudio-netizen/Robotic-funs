import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getCountryByCode } from "@/lib/countries";
import { useLocation } from "wouter";
import shareRobot from "@assets/file_000000004d8081f4bc975fdd26cf35e2_1791382630587.png";
import "./team.css";

type TeamLevel = 1 | 2 | 3;

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCommission: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
  level1RechargeAmount: number;
  level2RechargeAmount: number;
  level3RechargeAmount: number;
  teamRechargeAmount: number;
}

const formatWholeNumber = (value: number) =>
  Math.round(Number(value) || 0).toLocaleString("fr-FR");

const formatAmount = (value: number, decimals = false) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(Number(value) || 0);

export default function TeamPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeLevel, setActiveLevel] = useState<TeamLevel>(1);

  const {
    data: stats,
    isError: statsError,
  } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
  });

  const {
    data: settings,
    isError: settingsError,
  } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  if (!user) return null;

  const countryInfo = getCountryByCode(user.country || "TG");
  const rawCurrency = countryInfo?.currency || "FCFA";
  const currency = ["XOF", "XAF", "FCFA"].includes(rawCurrency) ? "FCFA" : rawCurrency;

  const selected = {
    1: {
      count: stats?.level1Count ?? 0,
      commission: stats?.level1Commission ?? 0,
      recharge: stats?.level1RechargeAmount ?? 0,
    },
    2: {
      count: stats?.level2Count ?? 0,
      commission: stats?.level2Commission ?? 0,
      recharge: stats?.level2RechargeAmount ?? 0,
    },
    3: {
      count: stats?.level3Count ?? 0,
      commission: stats?.level3Commission ?? 0,
      recharge: stats?.level3RechargeAmount ?? 0,
    },
  }[activeLevel];

  const rateValue = Number(settings?.[`level${activeLevel}Commission`]);
  const rateLabel = Number.isFinite(rateValue)
    ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(rateValue)}%`
    : "—";

  const teamSize =
    (stats?.level1Count ?? 0) +
    (stats?.level2Count ?? 0) +
    (stats?.level3Count ?? 0);

  return (
    <main className="team-page">
      <div className="team-page-shell">
        <section className="team-overview" aria-label="Résumé de l'équipe">
          <div className="team-overview-item">
            <span>Revenus de l'équipe</span>
            <strong>{formatAmount(stats?.totalCommission ?? 0, true)} {currency}</strong>
          </div>
          <div className="team-overview-item team-overview-item-centered">
            <span>Taille de l'équipe</span>
            <strong>{formatWholeNumber(teamSize)}</strong>
          </div>
          <div className="team-overview-item team-overview-item-right">
            <span>Recharge d'équipe</span>
            <strong>{formatAmount(stats?.teamRechargeAmount ?? 0)} {currency}</strong>
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
              data-testid={`team-level-tab-${level}`}
            >
              niveau {level}
            </button>
          ))}
        </div>

        <section className="team-active-summary" aria-live="polite">
          <div className="team-active-metrics">
            <span>Revenu ({currency}) : <strong>{formatAmount(selected.commission, true)}</strong></span>
            <span>Recharge ({currency}) : <strong>{formatAmount(selected.recharge)}</strong></span>
          </div>
          <p className="team-active-count">Tous {formatWholeNumber(selected.count)}</p>
        </section>

        <svg className="team-rate-clip-defs" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="team-rate-banner-clip" clipPathUnits="objectBoundingBox">
              <path d="M 0 0.05 Q 0.5 0.27 1 0.05 L 1 0.95 Q 0.5 0.73 0 0.95 Z" />
            </clipPath>
          </defs>
        </svg>

        <button
          type="button"
          className="team-rate-banner"
          onClick={() => navigate(`/team-details?level=${activeLevel}`)}
          aria-label={`Voir les détails de l’équipe au niveau ${activeLevel}`}
          data-testid="button-team-rate-details"
        >
          <span className="team-rate-banner-shape" aria-hidden="true" />
          <img className="team-rate-robot" src={shareRobot} alt="" aria-hidden="true" />
          <span className="team-rate-copy">
            <strong>{rateLabel}</strong>
            <span>Taux</span>
          </span>
        </button>

        {(statsError || settingsError) && (
          <p className="team-page-error" role="status">
            Certaines données de l’équipe ne sont pas disponibles pour le moment.
          </p>
        )}
      </div>
    </main>
  );
}
