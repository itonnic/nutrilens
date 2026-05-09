import type {
  AiJobResponse,
  AuthResponse,
  AuthUser,
  ConfirmMealInput,
  CreateWaterInput,
  CreateWeightInput,
  DailyDashboardResponse,
  LoginInput,
  MealResponse,
  MonthlyDashboardResponse,
  NutritionTargetsInput,
  OnboardingInput,
  ProfileResponse,
  RegisterInput,
  UpdateMealInput,
  UpdateProfileInput,
  WaterEntryResponse,
  WeeklyDashboardResponse,
  WeightEntryResponse,
} from '@nutrilens/shared';

const TOKEN_KEY = 'nutrilens.token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
  }
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Register a single global handler that fires the first time any API call
 * comes back with HTTP 401. The handler is debounced — it runs at most once
 * per "auth-error window" until it's re-armed via `clearUnauthorizedSeen()`.
 *
 * Wired in `Providers` to clear the token + redirect to /login.
 */
export function setOnUnauthorized(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
  unauthorizedSeen = false;
}

let unauthorizedSeen = false;
export function clearUnauthorizedSeen() {
  unauthorizedSeen = false;
}

/**
 * Read the `NEXT_LOCALE` cookie set by the language switcher so we can forward
 * the user's UI locale to the API on every request via `Accept-Language`. The
 * server uses this for AI prompt language and insight messages.
 *
 * Returns `undefined` during SSR (no `document`) — the caller falls back to the
 * browser's own `Accept-Language` header in that case.
 */
function getLocaleFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1];
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // Mirror the user's chosen locale to the API so AI insights, meal titles,
  // warnings, and assumptions come back in their language. The cookie is the
  // source of truth — it's set by the LanguageSwitcher and read in
  // `src/i18n/request.ts` for SSR.
  if (!headers.has('Accept-Language')) {
    const locale = getLocaleFromCookie();
    if (locale) headers.set('Accept-Language', locale);
  }

  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }

  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers,
    body,
    cache: 'no-store',
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const json = text ? safeParse(text) : undefined;

  if (!res.ok) {
    if (res.status === 401 && !unauthorizedSeen) {
      unauthorizedSeen = true;
      onUnauthorized?.();
    }
    const message =
      (json as { message?: string })?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, json);
  }

  return json as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  // auth
  register: (body: RegisterInput) =>
    request<AuthResponse>('/auth/register', { method: 'POST', json: body }),
  login: (body: LoginInput) =>
    request<AuthResponse>('/auth/login', { method: 'POST', json: body }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  me: () => request<AuthUser>('/auth/me'),

  // profile
  getProfile: () => request<ProfileResponse>('/profile'),
  completeOnboarding: (body: OnboardingInput) =>
    request<ProfileResponse>('/profile/onboarding', { method: 'POST', json: body }),
  updateProfile: (body: UpdateProfileInput) =>
    request<ProfileResponse>('/profile', { method: 'PATCH', json: body }),
  updateTargets: (body: NutritionTargetsInput) =>
    request<ProfileResponse>('/nutrition-targets', { method: 'PATCH', json: body }),

  // meals
  uploadMeal: async (form: FormData) => {
    const headers = new Headers();
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const locale = getLocaleFromCookie();
    if (locale) headers.set('Accept-Language', locale);
    const res = await fetch(`${baseUrl()}/meals/upload`, {
      method: 'POST',
      headers,
      body: form,
    });
    const text = await res.text();
    const json = text ? safeParse(text) : undefined;
    if (!res.ok) {
      const message =
        (json as { message?: string })?.message ?? `Upload failed (${res.status})`;
      throw new ApiError(res.status, message, json);
    }
    return json as { meal: MealResponse; jobId: string };
  },
  reanalyze: (mealId: string, userNote?: string) =>
    request<{ jobId: string }>('/meals/analyze', {
      method: 'POST',
      json: { mealId, userNote },
    }),
  confirmMeal: (id: string, body: ConfirmMealInput) =>
    request<MealResponse>(`/meals/${id}/confirm`, { method: 'POST', json: body }),
  updateMeal: (id: string, body: UpdateMealInput) =>
    request<MealResponse>(`/meals/${id}`, { method: 'PATCH', json: body }),
  deleteMeal: (id: string) =>
    request<void>(`/meals/${id}`, { method: 'DELETE' }),
  listMeals: (date: string) =>
    request<MealResponse[]>(`/meals?date=${encodeURIComponent(date)}`),
  getMeal: (id: string) => request<MealResponse>(`/meals/${id}`),

  // ai
  getAiJob: (id: string) => request<AiJobResponse>(`/ai/jobs/${id}`),

  // dashboard
  daily: (date: string) =>
    request<DailyDashboardResponse>(`/dashboard/daily?date=${encodeURIComponent(date)}`),
  weekly: (start: string) =>
    request<WeeklyDashboardResponse>(`/dashboard/weekly?start=${encodeURIComponent(start)}`),
  monthly: (month: string) =>
    request<MonthlyDashboardResponse>(`/dashboard/monthly?month=${encodeURIComponent(month)}`),

  // water
  listWater: (date: string) =>
    request<WaterEntryResponse[]>(`/water?date=${encodeURIComponent(date)}`),
  addWater: (body: CreateWaterInput) =>
    request<WaterEntryResponse>('/water', { method: 'POST', json: body }),
  deleteWater: (id: string) =>
    request<void>(`/water/${id}`, { method: 'DELETE' }),

  // weight
  listWeights: () => request<WeightEntryResponse[]>('/weight'),
  addWeight: (body: CreateWeightInput) =>
    request<WeightEntryResponse>('/weight', { method: 'POST', json: body }),
  deleteWeight: (id: string) =>
    request<void>(`/weight/${id}`, { method: 'DELETE' }),
};
