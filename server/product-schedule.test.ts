import assert from "node:assert/strict";
import { test } from "node:test";
import { isProductAvailableForCountry, isValidLaunchSchedule } from "./product-schedule";

const scheduledActivity = {
  isActive: true,
  productType: "activity",
  launchDate: "2026-10-07",
  launchTime: "10:00",
};

test("activity launch uses the same local clock for UTC launch countries", () => {
  const beforeLaunch = new Date("2026-10-07T09:59:00Z");
  const atLaunch = new Date("2026-10-07T10:00:00Z");

  assert.equal(isProductAvailableForCountry(scheduledActivity, "TG", beforeLaunch), false);
  assert.equal(isProductAvailableForCountry(scheduledActivity, "CI", atLaunch), true);
  assert.equal(isProductAvailableForCountry(scheduledActivity, "BF", atLaunch), true);
});

test("Benin, Cameroon, and Niger observe the same local launch one hour ahead", () => {
  const beforeLocalLaunch = new Date("2026-10-07T08:59:00Z");
  const atLocalLaunch = new Date("2026-10-07T09:00:00Z");

  for (const country of ["BJ", "CM", "NE"]) {
    assert.equal(isProductAvailableForCountry(scheduledActivity, country, beforeLocalLaunch), false);
    assert.equal(isProductAvailableForCountry(scheduledActivity, country, atLocalLaunch), true);
  }
});

test("inactive, invalidly scheduled, and future products are not available", () => {
  assert.equal(isProductAvailableForCountry({ ...scheduledActivity, isActive: false }, "TG", new Date("2026-10-07T10:00:00Z")), false);
  assert.equal(isProductAvailableForCountry({ ...scheduledActivity, launchDate: null }, "TG", new Date("2026-10-07T10:00:00Z")), false);
  assert.equal(isProductAvailableForCountry(scheduledActivity, "TG", new Date("2026-10-06T10:00:00Z")), false);
  assert.equal(isValidLaunchSchedule("2026-02-30", "10:00"), false);
  assert.equal(isValidLaunchSchedule("2026-10-07", "24:00"), false);
});

test("stable products are not delayed by an activity launch schedule", () => {
  assert.equal(isProductAvailableForCountry({
    ...scheduledActivity,
    productType: "stable",
    launchDate: null,
    launchTime: null,
  }, "TG", new Date("2026-10-01T00:00:00Z")), true);
});
