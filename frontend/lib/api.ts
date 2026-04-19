const BASE_URL = "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisitorStatus = "pending" | "approved" | "inside" | "rejected" | "exited";
export type AlertType = "overstay" | "blacklist" | "suspicious";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface LoginResponse {
  access_token: string;
  role: string;
  name: string;
}

export interface DashboardStats {
  total_visitors_today: number;
  active_inside: number;
  pending_approvals: number;
  overstayed: number;
}

export interface Visitor {
  id: number;
  name: string;
  email: string;
  phone: string;
  purpose: string;
  host_id: number;
  status: VisitorStatus;
  checkin_time: string | null;
  expected_duration: number;
  otp?: string;
}

export interface VisitorRegisterPayload {
  name: string;
  email: string;
  phone: string;
  purpose: string;
  host_id: number;
  expected_duration: number;
}

export interface VisitorRegisterResponse {
  visitor_id: number;
  otp: string;
  message: string;
}

export interface Alert {
  id: number;
  visitor_id: number;
  visitor_name: string;
  type: AlertType;
  message: string;
  resolved: boolean;
  created_at: string;
}

export interface AIAnalysisResult {
  visitor_id: number;
  visitor_name: string;
  visitor_photo?: string;
  phone: string;
  status: string;
  purpose: string;
  time_inside_minutes: number;
  expected_minutes: number;
  risk_score: number;
  risk_level: RiskLevel;
  suspicious_notes: string[];
  recommendation: string;
  summary: string;
  powered_by: string;
}

// ─── Internal wrapper type (matches FastAPI ResponseSchema) ───────────────────

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// POST /auth/login
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await apiFetch<BackendResponse<LoginResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.data;
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

// GET /dashboard/stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await apiFetch<BackendResponse<DashboardStats>>("/dashboard/stats");
  return res.data;
};

// ─── Visitors ─────────────────────────────────────────────────────────────────

// GET /visitors?status=&search=
export const getVisitors = async (status?: string, search?: string): Promise<Visitor[]> => {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const qs = params.toString();
  const res = await apiFetch<BackendResponse<Visitor[]>>(`/visitors${qs ? `?${qs}` : ""}`);
  return res.data;
};

// POST /visitors/register
export const registerVisitor = async (data: VisitorRegisterPayload): Promise<VisitorRegisterResponse> => {
  const res = await apiFetch<BackendResponse<VisitorRegisterResponse>>("/visitors/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
};

// POST /visitors/{id}/approve
export const approveVisitor = async (id: number): Promise<{ message: string }> => {
  const res = await apiFetch<BackendResponse<any>>(`/visitors/${id}/approve`, {
    method: "POST",
  });
  return { message: res.message };
};

// POST /visitors/{id}/reject
export const rejectVisitor = async (id: number): Promise<{ message: string }> => {
  const res = await apiFetch<BackendResponse<any>>(`/visitors/${id}/reject`, {
    method: "POST",
  });
  return { message: res.message };
};

// POST /visitors/{id}/checkin  body: { otp }
export const checkinVisitor = async (id: number, otp: string): Promise<{ message: string }> => {
  const res = await apiFetch<BackendResponse<any>>(`/visitors/${id}/checkin`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
  return { message: res.message };
};

// POST /visitors/{id}/checkout
export const checkoutVisitor = async (id: number): Promise<{ message: string }> => {
  const res = await apiFetch<BackendResponse<any>>(`/visitors/${id}/checkout`, {
    method: "POST",
  });
  return { message: res.message };
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

// GET /alerts
export const getAlerts = async (): Promise<Alert[]> => {
  const res = await apiFetch<BackendResponse<Alert[]>>("/alerts");
  return res.data;
};

// POST /alerts/check-overstay
export const triggerOverstayCheck = async (): Promise<{ message: string }> => {
  const res = await apiFetch<BackendResponse<any>>("/alerts/check-overstay", {
    method: "POST",
  });
  return { message: res.message };
};

// POST /alerts/{id}/resolve
export const resolveAlert = async (id: number): Promise<{ message: string }> => {
  const res = await apiFetch<BackendResponse<any>>(`/alerts/${id}/resolve`, {
    method: "POST",
  });
  return { message: res.message };
};

// ─── AI ───────────────────────────────────────────────────────────────────────

// POST /ai/analyze/{visitor_id}
export const analyzeVisitor = async (id: number): Promise<AIAnalysisResult> => {
  const res = await apiFetch<BackendResponse<AIAnalysisResult>>(`/ai/analyze/${id}`, {
    method: "POST",
  });
  return res.data;
};