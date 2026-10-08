import assert from "node:assert/strict";
import test from "node:test";
import {
  FORTUNE_WHEEL_PRIZES,
  getFortuneWheelRotationDegrees,
} from "../shared/fortune-wheel";

test("fortune wheel uses the nine prize amounts shown to users", () => {
  assert.deepEqual(FORTUNE_WHEEL_PRIZES, [
    100,
    200,
    300,
    500,
    1500,
    5000,
    7000,
    30000,
    35000,
  ]);
  assert.ok(FORTUNE_WHEEL_PRIZES.every((amount) => amount >= 100));
});

test("the selected wheel segment aligns with the fixed pointer after full rotations", () => {
  const segmentDegrees = 360 / FORTUNE_WHEEL_PRIZES.length;

  FORTUNE_WHEEL_PRIZES.forEach((_, prizeIndex) => {
    const rotation = getFortuneWheelRotationDegrees(prizeIndex);
    const normalized = rotation % 360;
    const expected = (360 - ((prizeIndex * segmentDegrees) + (segmentDegrees / 2))) % 360;
    assert.equal(normalized, expected);
  });
});

test("fortune wheel rotation rejects an invalid prize index", () => {
  assert.throws(() => getFortuneWheelRotationDegrees(-1), RangeError);
  assert.throws(
    () => getFortuneWheelRotationDegrees(FORTUNE_WHEEL_PRIZES.length),
    RangeError,
  );
});
