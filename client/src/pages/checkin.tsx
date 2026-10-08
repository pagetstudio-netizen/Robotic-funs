import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  FORTUNE_WHEEL_PRIZES,
  getFortuneWheelLossRotationDegrees,
  getFortuneWheelRotationDegrees,
} from "@shared/fortune-wheel";
import CheckinGameVisual from "./checkin-game-visual";

interface FortuneWheelStatus {
  availableSpins: number;
}

interface ClaimResponse {
  success: boolean;
  won: boolean;
  amount: number | null;
  prizeIndex: number | null;
  lossBoundaryIndex: number | null;
  availableSpins: number;
  message?: string;
}

const SPIN_DURATION_MS = 5_450;

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function CheckinPage() {
  const { user, refreshUser } = useAuth();
  const [wheelRotationDegrees, setWheelRotationDegrees] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultAmount, setResultAmount] = useState<number | null>(null);
  const [isLossResult, setIsLossResult] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isNoSpinsModalOpen, setIsNoSpinsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const spinTimer = useRef<number | null>(null);

  const statusQuery = useQuery<FortuneWheelStatus>({
    queryKey: ["/api/fortune-wheel/status"],
    enabled: Boolean(user),
  });

  useEffect(() => () => {
    if (spinTimer.current !== null) window.clearTimeout(spinTimer.current);
  }, []);

  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/fortune-wheel/spin", {});
      return response.json() as Promise<ClaimResponse>;
    },
    onMutate: () => {
      setErrorMessage(null);
      setResultAmount(null);
      setIsLossResult(false);
      setResultMessage(null);
      setIsNoSpinsModalOpen(false);
    },
    onSuccess: (result) => {
      const validWin =
        result.won === true &&
        typeof result.prizeIndex === "number" &&
        Number.isInteger(result.prizeIndex) &&
        result.prizeIndex >= 0 &&
        result.prizeIndex < FORTUNE_WHEEL_PRIZES.length &&
        typeof result.amount === "number" &&
        FORTUNE_WHEEL_PRIZES[result.prizeIndex] === result.amount &&
        result.amount <= 500 &&
        result.lossBoundaryIndex === null;
      const validLoss =
        result.won === false &&
        result.amount === null &&
        result.prizeIndex === null &&
        typeof result.lossBoundaryIndex === "number" &&
        Number.isInteger(result.lossBoundaryIndex) &&
        result.lossBoundaryIndex >= 0 &&
        result.lossBoundaryIndex < FORTUNE_WHEEL_PRIZES.length;

      if (!result.success || (!validWin && !validLoss)) {
        setErrorMessage("Le résultat du tirage n'a pas pu être vérifié.");
        void refreshUser();
        void queryClient.invalidateQueries({ queryKey: ["/api/fortune-wheel/status"] });
        return;
      }

      const targetRotation = result.won
        ? getFortuneWheelRotationDegrees(result.prizeIndex as number)
        : getFortuneWheelLossRotationDegrees(result.lossBoundaryIndex as number);
      if (spinTimer.current !== null) window.clearTimeout(spinTimer.current);
      setWheelRotationDegrees((current) =>
        current + targetRotation,
      );
      setIsSpinning(true);
      const spinDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 650
        : SPIN_DURATION_MS;

      spinTimer.current = window.setTimeout(() => {
        setIsSpinning(false);
        setIsLossResult(!result.won);
        setResultAmount(result.won ? result.amount : null);
        setResultMessage(
          result.message ||
            (result.won
              ? `Vous avez gagné ${formatAmount(result.amount ?? 0)} FCFA !`
              : "Désolé, vous n'avez rien gagné cette fois-ci."),
        );
        void Promise.allSettled([
          queryClient.invalidateQueries({ queryKey: ["/api/fortune-wheel/status"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
          refreshUser(),
        ]);
      }, spinDuration);
    },
    onError: (error: Error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 400) {
        setIsNoSpinsModalOpen(true);
        void statusQuery.refetch();
        return;
      }
      setErrorMessage(
        error.message || "Impossible de lancer la roue. Réessayez.",
      );
    },
  });

  if (!user) return null;

  const availableSpins = statusQuery.data?.availableSpins ?? 0;
  const visibleError =
    errorMessage ||
    (statusQuery.isError
      ? "Impossible de vérifier vos tours gratuits pour le moment."
      : null);

  return (
    <CheckinGameVisual
      labels={[...FORTUNE_WHEEL_PRIZES]}
      wheelRotationDegrees={wheelRotationDegrees}
      isSpinning={isSpinning}
      isClaiming={claimMutation.isPending || statusQuery.isLoading}
      availableSpins={availableSpins}
      resultAmount={resultAmount}
      isLossResult={isLossResult}
      resultMessage={resultMessage}
      isNoSpinsModalOpen={isNoSpinsModalOpen}
      errorMessage={visibleError}
      onDismissNoSpins={() => setIsNoSpinsModalOpen(false)}
      onDismissResult={() => {
        setResultAmount(null);
        setIsLossResult(false);
        setResultMessage(null);
      }}
      onPlay={() => {
        if (claimMutation.isPending || isSpinning || statusQuery.isLoading) return;
        if (statusQuery.isError) {
          setErrorMessage("Impossible de vérifier vos tours gratuits pour le moment.");
          return;
        }
        if (availableSpins < 1) {
          setIsNoSpinsModalOpen(true);
          return;
        }
        claimMutation.mutate();
      }}
    />
  );
}
