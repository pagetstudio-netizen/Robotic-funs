export const FORTUNE_WHEEL_PRIZES = [
  100,
  200,
  300,
  500,
  1500,
  5000,
  7000,
  30000,
  35000,
] as const;

export const FORTUNE_WHEEL_DRAW_PRIZES = [
  100,
  200,
  300,
  500,
] as const;

const FORTUNE_WHEEL_DRAW_WEIGHTS = [45, 30, 20, 5] as const;
export const FORTUNE_WHEEL_LOSS_CHANCE_PERCENT = 20;

export type FortuneWheelOutcome =
  | { won: true; prizeIndex: number }
  | { won: false; lossBoundaryIndex: number };

export function selectFortuneWheelOutcome(
  lossRoll: number,
  prizeRoll: number,
  lossBoundaryRoll: number,
): FortuneWheelOutcome {
  if (!Number.isInteger(lossRoll) || lossRoll < 0 || lossRoll >= 100) {
    throw new RangeError("Tirage de roue invalide.");
  }
  if (
    !Number.isInteger(lossBoundaryRoll) ||
    lossBoundaryRoll < 0 ||
    lossBoundaryRoll >= FORTUNE_WHEEL_PRIZES.length
  ) {
    throw new RangeError("Séparation de roue invalide.");
  }
  if (lossRoll < FORTUNE_WHEEL_LOSS_CHANCE_PERCENT) {
    return { won: false, lossBoundaryIndex: lossBoundaryRoll };
  }
  return {
    won: true,
    prizeIndex: selectFortuneWheelPrizeIndex(prizeRoll),
  };
}

export function selectFortuneWheelPrizeIndex(randomRoll: number): number {
  const totalWeight = FORTUNE_WHEEL_DRAW_WEIGHTS.reduce((total, weight) => total + weight, 0);
  if (!Number.isInteger(randomRoll) || randomRoll < 0 || randomRoll >= totalWeight) {
    throw new RangeError("Tirage de roue invalide.");
  }

  let weightLimit = 0;
  for (let index = 0; index < FORTUNE_WHEEL_DRAW_WEIGHTS.length; index += 1) {
    weightLimit += FORTUNE_WHEEL_DRAW_WEIGHTS[index];
    if (randomRoll < weightLimit) return index;
  }

  throw new RangeError("Tirage de roue invalide.");
}

export function getFortuneWheelRotationDegrees(
  prizeIndex: number,
  fullTurns = 5,
): number {
  if (
    !Number.isInteger(prizeIndex) ||
    prizeIndex < 0 ||
    prizeIndex >= FORTUNE_WHEEL_PRIZES.length
  ) {
    throw new RangeError("Indice de gain de roue invalide.");
  }

  const turns = Math.max(1, Math.floor(fullTurns));
  const degreesPerSegment = 360 / FORTUNE_WHEEL_PRIZES.length;
  const segmentCenter = (prizeIndex * degreesPerSegment) + (degreesPerSegment / 2);
  const alignment = (360 - segmentCenter) % 360;
  return turns * 360 + alignment;
}

export function getFortuneWheelLossRotationDegrees(
  boundaryIndex: number,
  fullTurns = 5,
): number {
  if (
    !Number.isInteger(boundaryIndex) ||
    boundaryIndex < 0 ||
    boundaryIndex >= FORTUNE_WHEEL_PRIZES.length
  ) {
    throw new RangeError("Indice de séparation de roue invalide.");
  }

  const turns = Math.max(1, Math.floor(fullTurns));
  const degreesPerSegment = 360 / FORTUNE_WHEEL_PRIZES.length;
  const boundaryAngle = boundaryIndex * degreesPerSegment;
  const alignment = (360 - boundaryAngle) % 360;
  return turns * 360 + alignment;
}
