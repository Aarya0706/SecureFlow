import { redis } from "./redis";
import { v4 as uuidv4 } from "uuid";

/**
 * Attempts to acquire a distributed lock.
 * Returns a unique lock token if successful, or null if the lock is already held.
 */
export async function acquireLock(key: string, ttlMs: number): Promise<string | null> {
  // Mock DB environments do not use Redis
  if (process.env.NEXT_PUBLIC_MOCK_DB === "true") {
    return `mock-lock-token-${Date.now()}`;
  }

  const token = uuidv4();
  // NX: Only set the key if it does not already exist.
  // PX: Set the specified expire time, in milliseconds.
  const result = await redis.set(key, token, "PX", ttlMs, "NX");

  if (result === "OK") {
    return token;
  }
  return null;
}

/**
 * Releases a distributed lock using the unique token.
 * A Lua script ensures that the lock is only deleted if the token matches,
 * preventing accidental deletion of a lock held by another process if it expired.
 */
export async function releaseLock(key: string, token: string): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_MOCK_DB === "true") {
    return true;
  }

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    const result = await redis.eval(script, 1, key, token);
    return result === 1;
  } catch (error) {
    console.error(`[RedisLock] Error releasing lock for key ${key}:`, error);
    return false;
  }
}
