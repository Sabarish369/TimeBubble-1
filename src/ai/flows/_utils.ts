// Shared server-side utilities for AI flows

/**
 * Shared AI utilities: retry with backoff, standardized error normalization, and pro-gating guards.
 */

type Retryable<T> = () => Promise<T>;

export interface RetryOptions {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export async function withAiRetry<T>(fn: Retryable<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 2, initialDelayMs = 1000, maxDelayMs = 8000 } = options;
  let attempt = 0;
  let delay = initialDelayMs;

  // First attempt without delay
  try {
    return await fn();
  } catch (err: any) {
    // If invalid key, don't retry
    if (isInvalidApiKeyError(err)) throw normalizeAiError(err);
  }

  while (attempt < retries) {
    await sleep(delay);
    try {
      return await fn();
    } catch (err: any) {
      if (isInvalidApiKeyError(err)) throw normalizeAiError(err);
      // Exponential backoff
      delay = Math.min(delay * 2, maxDelayMs);
      attempt++;
      if (attempt >= retries) throw normalizeAiError(err);
    }
  }

  // Should be unreachable
  throw new Error('AI retry failed');
}

export function normalizeAiError(err: any): Error {
  const message =
    err?.status === 429 || /429|rate limit/i.test(String(err?.message))
      ? '429 Too Many Requests - API rate limit exceeded. Please update your Gemini API key.'
      : err?.status === 400 || /api key not valid|invalid api key/i.test(String(err?.message))
      ? 'Invalid API Key. Please check your key in the settings.'
      : err?.message || 'AI request failed';
  return new Error(message);
}

export function isInvalidApiKeyError(err: any): boolean {
  return err?.status === 400 || /api key not valid|invalid api key/i.test(String(err?.message));
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


