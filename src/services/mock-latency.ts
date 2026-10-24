export const MOCK_LATENCY_MS = 400;

/** Resolves (or rejects) with the result of `produce` after a simulated network delay. */
export function withLatency<T>(produce: () => T, delayMs = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(produce());
      } catch (error) {
        reject(error);
      }
    }, delayMs);
  });
}
