import { API_URL } from '../config';
import type { Medication, PackKind } from '../data/medications';

// ---------- Types renvoyés par le backend ----------

export type User = { id: string; email: string; name: string; doctorPhone: string | null };

export type RequestStatus = 'IN_REVIEW' | 'APPROVED' | 'READY' | 'COLLECTED';

export type PrescriptionRequest = {
  id: string;
  medicationId: string | null;
  medicationName: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type Dashboard = {
  user: { name: string };
  nextDose: { medicationId: string; name: string; time: string; tomorrow: boolean } | null;
  requests: { active: number; inReview: number; approved: number; ready: number; series: number[] };
  readyMedications: { requestId: string; name: string }[];
  lowStock: number;
};

export type ScanResult = {
  name: string;
  dosage: string;
  form: string;
  quantity: string;
  expiry: string | null;
  confidence: number;
};

export type NewMedication = {
  name: string;
  subtitle?: string;
  kind: PackKind;
  remaining: number;
  total?: number;
  unit?: 'restantes' | 'ml';
  dosePerTake?: number;
  times?: string[];
  expiry?: string | null;
};

type AuthResponse = { token: string; user: User };

// ---------- Client HTTP ----------

export class ApiError extends Error {
  constructor(
    public status: number, // 0 = pas de connexion au serveur
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Ocorreu um erro inesperado.';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};
/** Appelé quand le serveur répond 401 à une requête authentifiée (session expirée). */
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(
  path: string,
  opts: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Sem ligação ao servidor. Verifique a rede e o endereço da API.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized?.();
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'HTTP',
      data?.error?.message ?? `Erro do servidor (${res.status}).`
    );
  }
  return data as T;
}

// ---------- Endpoints ----------

export const api = {
  config: () =>
    request<{ emergencyNumber: string; sns24Number: string }>('/api/config', { auth: false }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
      auth: false,
    }),
  me: () => request<{ user: User }>('/api/me'),
  updateMe: (patch: { name?: string; doctorPhone?: string | null }) =>
    request<{ user: User }>('/api/me', { method: 'PATCH', body: patch }),

  medications: () => request<{ medications: Medication[] }>('/api/medications').then((r) => r.medications),
  createMedication: (body: NewMedication) =>
    request<{ medication: Medication }>('/api/medications', { method: 'POST', body }).then((r) => r.medication),
  refill: (medicationId: string) =>
    request<{ request: PrescriptionRequest }>(`/api/medications/${medicationId}/refill`, {
      method: 'POST',
    }).then((r) => r.request),
  takeDose: (medicationId: string) =>
    request<{ medication: Medication }>('/api/doses', { method: 'POST', body: { medicationId } }),

  prescriptions: () =>
    request<{ requests: PrescriptionRequest[] }>('/api/prescriptions').then((r) => r.requests),
  dashboard: (sinceIso: string) =>
    request<Dashboard>(`/api/dashboard?since=${encodeURIComponent(sinceIso)}`),

  parseScan: (lines: string[]) =>
    request<{ result: ScanResult }>('/api/scan/parse', { method: 'POST', body: { lines } }).then((r) => r.result),
};

/** Début de la journée locale (envoyé au backend pour calculer « la prochaine prise »). */
export const startOfTodayIso = () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString();