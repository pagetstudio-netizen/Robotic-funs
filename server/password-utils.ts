import bcrypt from "bcrypt";

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;

export function isValidPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= MIN_PASSWORD_LENGTH &&
    value.length <= MAX_PASSWORD_LENGTH
  );
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function resetUserPassword(
  value: unknown,
  persist: (password: string) => Promise<unknown>,
): Promise<boolean> {
  if (!isValidPassword(value)) return false;
  await persist(value);
  return true;
}

export async function changeUserPassword(
  currentPassword: string,
  newPassword: unknown,
  currentHash: string,
  persist: (password: string) => Promise<unknown>,
): Promise<"updated" | "invalid_new_password" | "incorrect_current_password"> {
  if (!isValidPassword(newPassword)) return "invalid_new_password";
  if (!await verifyPassword(currentPassword, currentHash)) return "incorrect_current_password";
  await persist(newPassword);
  return "updated";
}
