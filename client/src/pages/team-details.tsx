import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Menu, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getCountryByCode } from "@/lib/countries";
import "./team-details.css";

type TeamLevel = 1 | 2 | 3;

interface TeamMember {
  id: number;
  fullName: string;
  phone: string;
  country: string;
  createdAt: string;
  totalInvested: number;
}

interface TeamDetails {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  totalLevel1Invested: number;
  totalLevel2Invested: number;
  totalLevel3Invested: number;
  level1DailyRechargeAmount: number;
  level2DailyRechargeAmount: number;
  level3DailyRechargeAmount: number;
  level1DailyRechargeCount: number;
  level2DailyRechargeCount: number;
  level3DailyRechargeCount: number;
}

function maskPhone(phone: string): string {
  return phone.length <= 4 ? phone : `******${phone.slice(-4)}`;
}

function formatMemberDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatToday(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function TeamDetailsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const requestedLevel = Number(new URLSearchParams(window.location.search).get("level"));
  const activeLevel: TeamLevel = requestedLevel === 2 || requestedLevel === 3 ? requestedLevel : 1;

  const {
    data: team,
    isLoading,
    isError,
  } = useQuery<TeamDetails>({
    queryKey: ["/api/team/details"],
  });

  const country = getCountryByCode(user?.country || "TG");
  const rawCurrency = country?.currency || "FCFA";
  const currency = ["XOF", "XAF", "FCFA"].includes(rawCurrency) ? "FCFA" : rawCurrency;

  const membersByLevel = {
    1: team?.level1 ?? [],
    2: team?.level2 ?? [],
    3: team?.level3 ?? [],
  }[activeLevel];
  const dailySummary = {
    1: {
      amount: team?.level1DailyRechargeAmount ?? 0,
      count: team?.level1DailyRechargeCount ?? 0,
    },
    2: {
      amount: team?.level2DailyRechargeAmount ?? 0,
      count: team?.level2DailyRechargeCount ?? 0,
    },
    3: {
      amount: team?.level3DailyRechargeAmount ?? 0,
      count: team?.level3DailyRechargeCount ?? 0,
    },
  }[activeLevel];

  return (
    <main className="team-details-page">
      <header className="team-details-header">
        <button
          type="button"
          className="team-details-back"
          onClick={() => navigate("/team")}
          data-testid="button-back-team"
          aria-label="Retour à la page Partager"
        >
          <ChevronLeft aria-hidden="true" />
          <span>Retour</span>
        </button>
        <h1 data-testid="text-page-title">Détails de l'équipe LV{activeLevel}</h1>
      </header>

      <section className="team-details-cards" aria-label="Recharges du jour">
        <article className="team-details-stat-card">
          <Menu className="team-details-card-menu" aria-hidden="true" />
          <span className="team-details-stat-label">Recharge du jour</span>
          <strong className="team-details-stat-value" data-testid="text-daily-recharge">
            {isLoading ? "—" : formatAmount(dailySummary.amount)}
            {!isLoading && <small> {currency}</small>}
          </strong>
          <time className="team-details-stat-date">{formatToday()}</time>
        </article>

        <article className="team-details-stat-card">
          <Menu className="team-details-card-menu" aria-hidden="true" />
          <span className="team-details-stat-label">Nombre de recharges</span>
          <strong className="team-details-stat-value" data-testid="text-daily-recharge-count">
            {isLoading ? "—" : dailySummary.count.toLocaleString("fr-FR")}
          </strong>
          <time className="team-details-stat-date">{formatToday()}</time>
        </article>
      </section>

      <section className="team-details-members" aria-label={`Filleuls du niveau ${activeLevel}`}>
        {isLoading ? (
          <div className="team-details-loading" aria-label="Chargement des filleuls">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <p className="team-details-message team-details-error" role="alert">
            Impossible de charger les détails de l’équipe.
          </p>
        ) : membersByLevel.length === 0 ? (
          <p className="team-details-message">Plus de données</p>
        ) : (
          <div className="team-details-member-list">
            {membersByLevel.map((member) => (
              <article
                key={member.id}
                className="team-details-member"
                data-testid={`team-member-${member.id}`}
              >
                <span className="team-details-member-avatar" aria-hidden="true">
                  <UserRound />
                </span>
                <span className="team-details-member-copy">
                  <strong>Compte : {maskPhone(member.phone)}</strong>
                  <small>Date : {formatMemberDate(member.createdAt)}</small>
                </span>
                <strong className="team-details-member-amount">
                  {Number(member.totalInvested).toLocaleString("fr-FR")} {currency}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
