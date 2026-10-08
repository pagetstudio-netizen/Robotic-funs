import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getCountryByCode, type ApiCountry } from "@/lib/countries";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import EmptyState from "@/components/empty-state";
import { getTransactionOrderNumber } from "@shared/transaction-order-number";

interface Deposit {
  id: number;
  amount: string | number;
  status: string;
  createdAt: string;
  accountNumber?: string | null;
}

interface Withdrawal {
  id: number;
  amount: string | number;
  netAmount?: string | number;
  fees?: string | number | null;
  status: string;
  createdAt: string;
  accountNumber?: string | null;
}

interface Transaction {
  id: number;
  type: string;
  amount: string | number;
  createdAt: string;
  description?: string;
}

type ActiveTab = "rewards" | "deposits" | "withdrawals";

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getStatusInfo = (status: string, kind: "earning" | "deposit" | "withdrawal") => {
  switch (status) {
    case "completed":
    case "approved":
      return {
        label: kind === "withdrawal" ? "Transfert terminé" : kind === "deposit" ? "Dépôt terminé" : "Crédité",
        tone: "is-success",
      };
    case "rejected":
    case "failed":
    case "canceled":
    case "cancelled":
      return {
        label: kind === "withdrawal" ? "Transfert échoué" : kind === "deposit" ? "Dépôt échoué" : "Échec",
        tone: "is-failure",
      };
    case "processing":
      return { label: "En cours", tone: "is-pending" };
    default:
      return { label: "En attente", tone: "is-pending" };
  }
};

const maskAccountNumber = (value?: string | null) => {
  const trimmed = value?.trim();
  const digits = trimmed?.replace(/\D/g, "") ?? "";
  if (!digits) return "";

  const prefix = digits.length > 3 ? digits.slice(0, 1) : "";
  const suffix = digits.slice(-2);
  const hiddenDigits = Math.max(1, digits.length - prefix.length - suffix.length);
  return `${trimmed?.startsWith("+") ? "+" : ""}${prefix}${"*".repeat(hiddenDigits)}${suffix}`;
};

const REWARD_TYPES = new Set([
  "signup_bonus",
  "gift_code",
  "checkin",
  "check_in",
  "daily_checkin",
  "wheel_prize",
]);

const isRewardTransaction = (transaction: Transaction) => {
  const type = transaction.type.toLowerCase();
  const description = transaction.description?.toLowerCase() || "";
  if (REWARD_TYPES.has(type)) return true;
  if (type !== "bonus" && type !== "daily_bonus") return false;
  return /inscription|quotidien|check.?in|pointage|connexion/.test(description);
};

const getRewardTitle = (transaction: Transaction) => {
  const description = transaction.description?.trim() || "";
  const normalized = description.toLowerCase();
  if (/inscription/.test(normalized) || transaction.type === "signup_bonus") {
    return "Bonus d'inscription";
  }
  if (/cadeau/.test(normalized) || transaction.type === "gift_code") {
    return "Code cadeau";
  }
  if (/roue de la fortune/.test(normalized) || transaction.type === "wheel_prize") {
    return "Gain de la roue de la fortune";
  }
  if (/quotidien|check.?in|pointage|connexion/.test(normalized) || REWARD_TYPES.has(transaction.type.toLowerCase())) {
    return "Récompenses de connexion";
  }
  return description || "Récompense";
};

function HistoryCard({
  code,
  createdAt,
  amount,
  status,
  currency,
  kind,
  fallbackDetail,
  accountNumber,
  referenceLabel,
  fees,
  testId,
}: {
  code: string;
  createdAt: string;
  amount: string;
  status: string;
  currency: string;
  kind: "earning" | "deposit" | "withdrawal";
  fallbackDetail: string;
  accountNumber?: string | null;
  referenceLabel: string;
  fees?: string | number | null;
  testId?: string;
}) {
  const statusInfo = getStatusInfo(status, kind);
  const maskedAccountNumber = maskAccountNumber(accountNumber);
  const paymentLabel = maskedAccountNumber ? `(${maskedAccountNumber})` : fallbackDetail;

  return (
    <article className="history-card" data-testid={testId}>
      <div className="history-row history-row-meta">
        <span>{formatDateTime(createdAt)}</span>
        <strong className={`history-status ${statusInfo.tone}`}>{statusInfo.label}</strong>
      </div>
      <div className="history-row history-row-main">
        <span>{paymentLabel}</span>
        <strong className="history-amount">{amount} {currency}</strong>
      </div>
      <div className="history-row history-row-reference">
        <span>{referenceLabel}</span>
        <strong className="history-value" title={code}>{code}</strong>
      </div>
      {fees != null && (
        <div className="history-row history-row-fees">
          <span>Frais</span>
          <strong className="history-value">{fees} {currency}</strong>
        </div>
      )}
    </article>
  );
}

function RewardHistoryRow({
  title,
  createdAt,
  amount,
  currentBalance,
  balanceLabel,
  currency,
  orderNumber,
  testId,
}: {
  title: string;
  createdAt: string;
  amount: string | number;
  currentBalance: string | number;
  balanceLabel?: string;
  currency: string;
  orderNumber: string;
  testId: string;
}) {
  const formatMoney = (value: string | number) => {
    const number = Number(value || 0);
    return (Number.isFinite(number) ? number : 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <article
      className="reward-row"
      data-testid={testId}
      data-order-number={orderNumber}
      aria-label={`${title}, ${formatDateTime(createdAt)}, montant ${formatMoney(amount)} ${currency}, numéro de commande ${orderNumber}`}
      title={`Numéro de commande ${orderNumber}`}
    >
      <div className="reward-row-heading">
        <strong className="reward-row-title">{title}</strong>
        <time className="reward-row-date">{formatDateTime(createdAt)}</time>
      </div>
      <div className="reward-row-values">
        <strong>+ {formatMoney(amount)}</strong>
        <span>{balanceLabel || "Solde actuel"} {formatMoney(currentBalance)} {currency}</span>
      </div>
    </article>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("rewards");
  const { data: apiCountries = [] } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });
  const countryInfo = user ? getCountryByCode(user.country, apiCountries) : null;
  const currency = countryInfo?.currency === "XOF" || countryInfo?.currency === "XAF"
    ? "FCFA"
    : countryInfo?.currency || "FCFA";
  const formatAmount = (value: string | number) => {
    const amount = Number(value || 0);
    return (Number.isFinite(amount) ? Math.round(amount) : 0).toLocaleString("fr-FR");
  };

  const {
    data: deposits = [],
    isLoading: depositsLoading,
    isError: depositsError,
  } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
    enabled: Boolean(user) && activeTab === "deposits",
  });

  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading,
    isError: withdrawalsError,
  } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
    enabled: Boolean(user) && activeTab === "withdrawals",
  });

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isError: transactionsError,
  } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: Boolean(user) && activeTab === "rewards",
  });

  if (!user) return null;

  const rewards = transactions
    .filter(isRewardTransaction)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  const sortedDeposits = [...deposits].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
  const sortedWithdrawals = [...withdrawals].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );

  const isLoading =
    activeTab === "rewards"
      ? transactionsLoading
      : activeTab === "deposits"
        ? depositsLoading
        : withdrawalsLoading;
  const isError =
      activeTab === "rewards"
      ? transactionsError
      : activeTab === "deposits"
        ? depositsError
        : withdrawalsError;

  return (
    <main className="history-page">
      <style>{`
        .history-page {
          width: 100%;
          min-height: 100dvh;
          overflow-x: clip;
          background: #fff;
          color: #171717;
          font-family: Arial, sans-serif;
        }
        .history-page *,
        .history-page *::before,
        .history-page *::after {
          box-sizing: border-box;
        }
        .history-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          background: #fff;
        }
        .history-header {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          height: 52px;
          align-items: center;
          padding: 0 18px;
          background: #24232f;
          color: #fff;
        }
        .history-back {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border: 0;
          padding: 0;
          background: transparent;
          color: #fff;
          cursor: pointer;
        }
        .history-back svg {
          width: 25px;
          height: 25px;
          stroke-width: 1.9;
        }
        .history-title {
          position: absolute;
          right: 48px;
          left: 48px;
          margin: 0;
          color: #fff;
          font-size: 22px;
          font-weight: 400;
          line-height: 1;
          text-align: center;
        }
        .history-balance-card {
          display: flex;
          height: clamp(180px, 41.2vw, 211px);
          flex-direction: column;
          margin: 32px 4% 38px;
          padding: 30px 20px 25px;
          border-radius: 20px;
          background: #24232f;
          color: #fff;
        }
        .history-balance-label {
          color: #d6d4dc;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.25;
        }
        .history-balance-grid {
          display: grid;
          flex: 1;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: center;
          gap: 12px;
          margin-top: 14px;
        }
        .history-balance-item {
          display: flex;
          min-width: 0;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }
        .history-balance-value {
          display: flex;
          align-items: baseline;
          justify-content: center;
          margin: 0;
          color: #fff;
          font-size: clamp(20px, 5.6vw, 30px);
          font-weight: 700;
          line-height: 1.1;
          overflow-wrap: anywhere;
          text-align: center;
        }
        .history-tabs {
          position: sticky;
          top: 52px;
          z-index: 40;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          align-items: center;
          min-height: 62px;
          margin: 0;
          padding: 9px 4%;
          border-bottom: 1px solid #eeeeef;
          background: #fff;
        }
        .history-tab {
          display: flex;
          min-width: 0;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 10px;
          padding: 5px 6px;
          background: #f3f3f5;
          color: #5f5f64;
          font-size: clamp(11px, 2.8vw, 14px);
          font-weight: 600;
          line-height: 1.15;
          text-align: center;
          white-space: normal;
          cursor: pointer;
          transition: background-color .16s ease, color .16s ease, transform .12s ease;
        }
        .history-tab.active {
          background: #24232f;
          color: #fff;
          font-weight: 700;
        }
        .history-tab:active { transform: scale(.98); }
        .history-tab:focus-visible,
        .history-back:focus-visible {
          outline: 3px solid #c1c0c9;
          outline-offset: 2px;
        }
        .history-content {
          min-height: calc(100dvh - 390px);
          padding: 0 4% 40px;
        }
        .history-list {
          display: grid;
          gap: 0;
        }
        .reward-row {
          padding: 21px 0 18px;
          border-bottom: 1px solid #ededed;
          color: #111;
        }
        .reward-row-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .reward-row-title {
          max-width: 60%;
          color: #686868;
          font-size: clamp(18px, 4.2vw, 22px);
          font-weight: 700;
          line-height: 1.55;
        }
        .reward-row-date {
          flex: 0 0 auto;
          padding-top: 4px;
          color: #a1a1a1;
          font-size: clamp(12px, 3.1vw, 16px);
          line-height: 1.35;
          white-space: nowrap;
        }
        .reward-row-values {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 13px;
          color: #111;
          font-size: clamp(16px, 3.9vw, 20px);
          line-height: 1.35;
        }
        .reward-row-values strong,
        .reward-row-values span {
          font-weight: 700;
        }
        .history-card {
          width: 100%;
          border: 0;
          border-bottom: 1px solid #ededed;
          border-radius: 0;
          display: flex;
          min-height: 100px;
          flex-direction: column;
          justify-content: space-between;
          padding: 18px 0;
          background: #fff;
          box-shadow: none;
        }
        .history-row {
          display: flex;
          min-height: 21px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #777;
          font-size: 14px;
          line-height: 1.35;
        }
        .history-row > span {
          min-width: 0;
          flex: 1;
        }
        .history-row strong {
          min-width: 0;
          max-width: 65%;
          color: #171717;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
          overflow-wrap: anywhere;
        }
        .history-row-meta { color: #999; font-size: 13px; }
        .history-row-meta strong {
          color: #999;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
        .history-row-main {
          color: #171717;
          font-size: 15px;
        }
        .history-row-main > span {
          color: #171717;
          font-weight: 500;
          overflow-wrap: anywhere;
        }
        .history-row .history-amount {
          color: #171717;
          font-size: 16px;
          font-weight: 700;
          white-space: nowrap;
        }
        .history-row-reference,
        .history-row-fees {
          color: #777;
          font-size: 13px;
        }
        .history-row .history-value {
          color: #555;
          font-size: 13px;
          font-weight: 700;
        }
        .history-row .history-status {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          white-space: nowrap;
        }
        .history-status.is-success { color: #777; }
        .history-status.is-failure { color: #bc3434; }
        .history-status.is-pending { color: #9a6b0a; }
        .history-empty {
          display: flex;
          min-height: 300px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #768078;
          font-size: 14px;
        }
        .history-load-error {
          padding: 32px 16px;
          color: #9c3434;
          text-align: center;
          font-size: 14px;
        }
        @media (max-width: 370px) {
          .history-title { font-size: 17px; }
          .history-tabs { gap: 5px; padding-right: 3%; padding-left: 3%; }
          .history-tab { font-size: 11px; }
          .history-content { padding-right: 3%; padding-left: 3%; }
          .history-balance-card { margin-right: 3%; margin-left: 3%; padding-right: 14px; padding-left: 14px; }
          .history-balance-grid { gap: 14px; }
          .history-balance-label { font-size: 13px; }
          .history-balance-value { font-size: 18px; }
          .history-card { padding-right: 0; padding-left: 0; }
          .history-row { gap: 8px; font-size: 12px; }
          .history-row strong { font-size: 11px; }
          .history-row-meta,
          .history-row-meta strong { font-size: 10px; }
          .history-row .history-amount { font-size: 13px; }
          .history-row .history-value { font-size: 11px; }
          .reward-row-heading { gap: 6px; }
          .reward-row-title { max-width: 56%; font-size: 16px; }
          .reward-row-date { font-size: 10px; }
          .reward-row-values { font-size: 13px; }
        }
      `}</style>

      <div className="history-screen">
        <header className="history-header">
          <Link href="/account">
            <button className="history-back" data-testid="button-back" aria-label="Retour">
              <ChevronLeft aria-hidden="true" />
            </button>
          </Link>
          <h1 className="history-title">Historique du solde</h1>
        </header>

        <section className="history-balance-card" aria-label="Soldes disponibles">
          <div className="history-balance-grid">
            <div className="history-balance-item">
              <span className="history-balance-label">Solde de retrait</span>
              <strong className="history-balance-value">
                {formatAmount(user.withdrawalBalance || "0")} {currency}
              </strong>
            </div>
            <div className="history-balance-item">
              <span className="history-balance-label">Solde de dépôt</span>
              <strong className="history-balance-value">
                {formatAmount(user.depositBalance || "0")} {currency}
              </strong>
            </div>
          </div>
        </section>

        <nav className="history-tabs" aria-label="Type d'enregistrement">
          <button
            type="button"
            className={`history-tab ${activeTab === "rewards" ? "active" : ""}`}
            onClick={() => setActiveTab("rewards")}
            aria-pressed={activeTab === "rewards"}
            data-testid="tab-rewards"
          >
            Récompenses
          </button>
          <button
            type="button"
            className={`history-tab ${activeTab === "deposits" ? "active" : ""}`}
            onClick={() => setActiveTab("deposits")}
            aria-pressed={activeTab === "deposits"}
            data-testid="tab-deposit-orders"
          >
            Ordres de dépôt
          </button>
          <button
            type="button"
            className={`history-tab ${activeTab === "withdrawals" ? "active" : ""}`}
            onClick={() => setActiveTab("withdrawals")}
            aria-pressed={activeTab === "withdrawals"}
            data-testid="tab-withdrawal-orders"
          >
            Ordres de retrait
          </button>
        </nav>

        <section className="history-content" aria-live="polite">
          {isLoading ? (
            <div className="history-empty">
              <Loader2 className="animate-spin" />
            </div>
          ) : isError ? (
            <p className="history-load-error">Impossible de charger cet historique. Réessayez plus tard.</p>
          ) : activeTab === "rewards" ? (
            rewards.length > 0 ? (
              <div className="history-list">
                {rewards.map((transaction) => (
                  <RewardHistoryRow
                    key={transaction.id}
                    testId={`free-earning-item-${transaction.id}`}
                    orderNumber={getTransactionOrderNumber("earning", transaction.id)}
                    createdAt={transaction.createdAt}
                    title={getRewardTitle(transaction)}
                    amount={transaction.amount}
                    currentBalance={
                      transaction.type === "wheel_prize"
                        ? user.depositBalance || "0"
                        : user.balance || "0"
                    }
                    balanceLabel={transaction.type === "wheel_prize" ? "Solde de dépôt" : undefined}
                    currency={currency}
                  />
                ))}
              </div>
            ) : (
              <EmptyState className="history-empty">
                <span>Plus de données</span>
              </EmptyState>
            )
          ) : activeTab === "deposits" ? (
            sortedDeposits.length > 0 ? (
              <div className="history-list">
                {sortedDeposits.map((deposit) => (
                  <HistoryCard
                    key={deposit.id}
                    testId={`deposit-item-${deposit.id}`}
                    code={getTransactionOrderNumber("deposit", deposit.id)}
                    createdAt={deposit.createdAt}
                    amount={formatAmount(deposit.amount)}
                    status={deposit.status}
                    currency={currency}
                    kind="deposit"
                    fallbackDetail="Dépôt"
                    accountNumber={deposit.accountNumber}
                    referenceLabel="Numéro de commande"
                  />
                ))}
              </div>
            ) : (
              <EmptyState className="history-empty">
                <span>Plus de données</span>
              </EmptyState>
            )
          ) : sortedWithdrawals.length > 0 ? (
            <div className="history-list">
              {sortedWithdrawals.map((withdrawal) => (
                <HistoryCard
                  key={withdrawal.id}
                  testId={`withdrawal-item-${withdrawal.id}`}
                    code={getTransactionOrderNumber("withdrawal", withdrawal.id)}
                  createdAt={withdrawal.createdAt}
                    amount={formatAmount(withdrawal.netAmount ?? withdrawal.amount)}
                  status={withdrawal.status}
                  currency={currency}
                    kind="withdrawal"
                    fallbackDetail="Retrait"
                    accountNumber={withdrawal.accountNumber}
                    referenceLabel="Numéro de commande"
                    fees={withdrawal.fees == null ? undefined : formatAmount(withdrawal.fees)}
                />
              ))}
            </div>
          ) : (
            <EmptyState className="history-empty">
              <span>Plus de données</span>
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}