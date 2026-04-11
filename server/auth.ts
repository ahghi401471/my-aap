import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, existingHash] = storedHash.split(":");

  if (!salt || !existingHash) {
    return false;
  }

  const candidateHash = scryptSync(password, salt, KEY_LENGTH);
  const existingHashBuffer = Buffer.from(existingHash, "hex");

  if (candidateHash.length !== existingHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, existingHashBuffer);
}
