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
