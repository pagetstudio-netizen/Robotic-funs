import assert from "node:assert/strict";
import test from "node:test";
import {
  changeUserPassword,
  hashPassword,
  isValidPassword,
  resetUserPassword,
  verifyPassword,
} from "./password-utils";

test("a stored password hash accepts the new password once and rejects others", async () => {
  const password = "NewSecure123";
  const storedHash = await hashPassword(password);

  assert.notEqual(storedHash, password);
  assert.equal(await verifyPassword(password, storedHash), true);
  assert.equal(await verifyPassword("Different123", storedHash), false);
});

test("password reset accepts only 6–128 character strings", () => {
  assert.equal(isValidPassword("12345"), false);
  assert.equal(isValidPassword("123456"), true);
  assert.equal(isValidPassword("x".repeat(128)), true);
  assert.equal(isValidPassword("x".repeat(129)), false);
  assert.equal(isValidPassword(123456), false);
});

test("admin password reset stores one hash that works for the next login", async () => {
  const password = "AdminReset123";
  let persistedHash = "";
  const saved = await resetUserPassword(password, async (rawPassword) => {
    persistedHash = await hashPassword(rawPassword);
  });

  assert.equal(saved, true);
  assert.equal(await verifyPassword(password, persistedHash), true);
  assert.equal(await verifyPassword(`${password}x`, persistedHash), false);
});

test("self-service password change checks the current password before saving", async () => {
  const currentPassword = "Current123";
  const currentHash = await hashPassword(currentPassword);
  let persistedHash = "";

  const changed = await changeUserPassword(
    currentPassword,
    "Replacement123",
    currentHash,
    async (rawPassword) => {
      persistedHash = await hashPassword(rawPassword);
    },
  );

  assert.equal(changed, "updated");
  assert.equal(await verifyPassword("Replacement123", persistedHash), true);
  assert.equal(await changeUserPassword(
    "wrong-current",
    "Another123",
    persistedHash,
    async () => assert.fail("Do not persist when the current password is incorrect"),
  ), "incorrect_current_password");
});
