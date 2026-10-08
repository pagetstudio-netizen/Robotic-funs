import { useState } from "react";
import CheckinGameVisual from "./CurrentVisual";

const CURRENT_PRIZES = [100, 100, 100, 100, 200, 200, 500, 1000];

export function Current() {
  const [hasClaimed, setHasClaimed] = useState(false);

  return (
    <CheckinGameVisual
      labels={CURRENT_PRIZES}
      wheelRotationDegrees={0}
      isSpinning={false}
      isClaiming={false}
      hasClaimedToday={hasClaimed}
      resultAmount={null}
      errorMessage={null}
      onPlay={() => setHasClaimed(true)}
    />
  );
}
