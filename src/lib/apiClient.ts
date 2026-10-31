import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

// =====================================================================================
// API BASE URL — the ONE place in the codebase that knows where the backend lives.
//
// To deploy to production, comment out the localhost line below and uncomment the Railway
// line. To switch back to local development, reverse it.
// =====================================================================================
// const API_URL = "http://localhost:8000/api/v1"; // LOCAL — active for development
const API_URL = "https://web-production-368d93.up.railway.app/api/v1"; // RAILWAY — uncomment for production, comment out the line above

/** The backend's standard error body: { error: { code, message, details } }. */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Every failed request rejects with this, whatever went wrong (backend error, validation
 * failure, network down), so callers only ever check `error.code`.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details ?? null;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** True when `error` is an ApiError carrying one of the backend's ErrorCode values. */
export function hasErrorCode(error: unknown, ...codes: string[]): boolean {
  return isApiError(error) && codes.includes(error.code);
}

// -------------------------------------------------------------------------------------
// Session state. The access token only ever lives in memory; the refresh token is an
// httpOnly cookie the browser sends by itself (withCredentials).
// -------------------------------------------------------------------------------------

let accessToken: string | null = null;
let activeAccountId: string | null = null;
let onSessionLost: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  scheduleProactiveRefresh(token);
}

// -------------------------------------------------------------------------------------
// Proactive refresh. A request sent just as the access token expires gets a 401 and has to
// be replayed; instead the token is renewed shortly BEFORE it expires (timer), and again
// right before a request goes out if the timer was late (background tabs throttle timers).
// -------------------------------------------------------------------------------------

/** Renew this long before the token's `exp`. */
const REFRESH_LEEWAY_MS = 60_000;

/** Reads the `exp` claim (ms since epoch) of a JWT without verifying it; null if unreadable. */
function tokenExpiryMs(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleProactiveRefresh(token: string | null) {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (typeof window === "undefined") return;
  const expiry = tokenExpiryMs(token);
  if (expiry === null) return;
  // setTimeout caps at ~24.8 days; access tokens live minutes, but stay safe.
  const delay = Math.min(Math.max(expiry - REFRESH_LEEWAY_MS - Date.now(), 0), 2_000_000_000);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    // Failure here is harmless: the next request 401s and the interceptor decides whether the
    // session is really over.
    void refreshOnce().catch(() => undefined);
  }, delay);
}

/** True when the in-memory token expires within half the leeway. */
function tokenNeedsRefresh() {
  const expiry = tokenExpiryMs(accessToken);
  return expiry !== null && expiry - Date.now() < REFRESH_LEEWAY_MS / 2;
}

export function getAccessToken() {
  return accessToken;
}

/** Sent as X-Account-Id so the backend knows which membership a request is acting as. */
export function setActiveAccountId(accountId: string | null) {
  activeAccountId = accountId;
}

/** Called once by the auth provider; runs when a refresh fails and the user must log in again. */
export function setSessionLostHandler(handler: (() => void) | null) {
  onSessionLost = handler;
}

// -------------------------------------------------------------------------------------
// Client
// -------------------------------------------------------------------------------------

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean; _sentToken?: string | null };

function isNoRefreshPath(path: string) {
  return NO_REFRESH_PATHS.some((p) => path.startsWith(p));
}

/** Auth endpoints answer 401 for bad credentials/tokens; refreshing for them makes no sense. */
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/mfa/verify",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
];

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  // A request that never answers must not leave "Saving..." dialogs spinning forever.
  timeout: 30_000,
});

apiClient.interceptors.request.use(async (config) => {
  // Token about to expire (or timer was throttled): every request waits on the same single
  // in-flight refresh and then goes out with the new token, so none of them 401s.
  if (accessToken && !isNoRefreshPath(config.url ?? "") && tokenNeedsRefresh()) {
    try {
      await refreshOnce();
    } catch {
      // Send with the old token; a real 401 is handled by the response interceptor.
    }
  }
  (config as RetriableConfig)._sentToken = accessToken;
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  if (activeAccountId) config.headers.set("X-Account-Id", activeAccountId);
  return config;
});

let refreshing: Promise<{ accessToken: string }> | null = null;

/**
 * One refresh at a time. Refresh tokens rotate, so two overlapping refreshes with the same
 * cookie would look like token reuse to the backend; every caller shares one request.
 */
function refreshOnce<T extends { accessToken: string }>(): Promise<T> {
  refreshing ??= axios
    .post<T>(`${API_URL}/auth/refresh`, null, { withCredentials: true })
    .then((response) => {
      setAccessToken(response.data.accessToken);
      return response.data;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing as Promise<T>;
}

/**
 * Restores the access token from the refresh cookie (used on app load). Returns the full
 * login payload, or null when the server says there is no valid session. When the server
 * cannot be reached at all it throws instead, so an offline user is not signed out.
 */
export async function restoreSession<T extends { accessToken: string }>(): Promise<T | null> {
  try {
    return await refreshOnce<T>();
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) throw normalizeError(error);
    setAccessToken(null);
    return null;
  }
}

function normalizeError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as { error?: Partial<ApiErrorBody> } | undefined;
  const body = data?.error;
  if (body && typeof body.code === "string") {
    return new ApiError(status, {
      code: body.code,
      message: body.message ?? body.code,
      details: body.details,
    });
  }
  if (!error.response) {
    return new ApiError(0, { code: "NETWORK_ERROR", message: "Could not reach the server." });
  }
  return new ApiError(status, {
    code: status === 401 ? "UNAUTHORIZED" : "INTERNAL",
    message: error.message,
  });
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const path = config?.url ?? "";
    const canRefresh =
      error.response?.status === 401 &&
      config !== undefined &&
      !config._retried &&
      !isNoRefreshPath(path);

    if (canRefresh) {
      config._retried = true;
      try {
        // If another request already renewed the token since this one was sent, just replay
        // with it; otherwise join (or start) the single shared refresh.
        const renewedMeanwhile = accessToken !== null && accessToken !== config._sentToken;
        if (!renewedMeanwhile) await refreshOnce();
      } catch (refreshError) {
        // Only a definite rejection from the server ends the session. A network blip during
        // refresh must not log the user out.
        if (axios.isAxiosError(refreshError) && !refreshError.response) {
          throw normalizeError(error);
        }
        setAccessToken(null);
        onSessionLost?.();
        throw normalizeError(error);
      }
      return apiClient(config);
    }
    throw normalizeError(error);
  },
);

/**
 * Unwraps `response.data`. Services call these instead of touching axios directly, so
 * `apiClient` stays the only way any code talks to the backend.
 */
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, body?: unknown) => apiClient.post<T>(url, body).then((r) => r.data),
  put: <T>(url: string, body?: unknown) => apiClient.put<T>(url, body).then((r) => r.data),
  patch: <T>(url: string, body?: unknown) => apiClient.patch<T>(url, body).then((r) => r.data),
  delete: <T = void>(url: string) => apiClient.delete<T>(url).then((r) => r.data),
  /** Fetches a binary file (e.g. a server-rendered PDF) with the same auth as every other
   * request -- unlike a presigned storage URL, these endpoints require the Authorization
   * header, so a plain `<a href>` or `window.open` can't reach them directly. */
  getBlob: (url: string) =>
    apiClient.get<Blob>(url, { responseType: "blob" }).then((r) => r.data),
};

/**
 * Uploads a file straight from the browser to object storage (R2) with the presigned URL the
 * backend issued. This request goes to the storage host, not our API, so it carries no
 * Authorization header, account header or cookies.
 */
export async function uploadToStorage(uploadUrl: string, file: Blob, mime: string): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": mime },
    withCredentials: false,
  });
}

/** Standard list envelope returned by every paginated endpoint. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: 10 | 25 | 50;
}
