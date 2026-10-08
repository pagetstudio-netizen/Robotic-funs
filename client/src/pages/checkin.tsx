import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FORTUNE_WHEEL_PRIZES,
  getFortuneWheelRotationDegrees,
} from "@shared/fortune-wheel";
import CheckinGameVisual from "./checkin-game-visual";

interface FortuneWheelStatus {
  availableSpins: number;
}

interface ClaimResponse {
  success: boolean;
  amount: number;
  prizeIndex: number;
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
  const { toast } = useToast();
  const [wheelRotationDegrees, setWheelRotationDegrees] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultAmount, setResultAmount] = useState<number | null>(null);
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
    },
    onSuccess: (result) => {
      if (
        !Number.isInteger(result.prizeIndex) ||
        FORTUNE_WHEEL_PRIZES[result.prizeIndex] !== result.amount
      ) {
        setErrorMessage("Le résultat du tirage n'a pas pu être vérifié.");
        void refreshUser();
        void queryClient.invalidateQueries({ queryKey: ["/api/fortune-wheel/status"] });
        return;
      }

      if (spinTimer.current !== null) window.clearTimeout(spinTimer.current);
      setWheelRotationDegrees((current) =>
        current + getFortuneWheelRotationDegrees(result.prizeIndex),
      );
      setIsSpinning(true);
      const spinDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 650
        : SPIN_DURATION_MS;

      spinTimer.current = window.setTimeout(() => {
        setIsSpinning(false);
        setResultAmount(result.amount);
        toast({
          title: "Tour gratuit utilisé !",
          description: result.message || `Vous avez gagné ${formatAmount(result.amount)} FCFA.`,
          duration: 2500,
        });
        void Promise.allSettled([
          queryClient.invalidateQueries({ queryKey: ["/api/fortune-wheel/status"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
          refreshUser(),
        ]);
      }, spinDuration);
    },
    onError: (error: Error) => {
      const status = (error as Error & { status?: number }).status;
      setErrorMessage(
        status === 400
          ? "Vous n'avez pas de tour gratuit disponible."
          : error.message || "Impossible de lancer la roue. Réessayez.",
      );
      if (status === 400) void statusQuery.refetch();
    },
  });

  if (!user) return null;

  const currency = getCountryByCode(user.country)?.currency || "FCFA";
  const currencyLabel = /^(XOF|XAF|FCFA)$/i.test(currency) ? "FCFA" : currency;
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
      errorMessage={visibleError}
      onPlay={() => {
        if (claimMutation.isPending || isSpinning || availableSpins < 1) return;
        claimMutation.mutate();
      }}
    />
  );
}
