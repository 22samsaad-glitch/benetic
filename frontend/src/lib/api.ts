import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type {
  AuthTokens,
  RegisterRequest,
  LoginRequest,
  User,
  Lead,
  LeadCreate,
  LeadUpdate,
  LeadEvent,
  Pipeline,
  PipelineStage,
  PipelineStageCreate,
  Workflow,
  WorkflowCreate,
  WorkflowExecution,
  MessageTemplate,
  TemplateCreate,
  Task,
  TaskCreate,
  IntegrationConfig,
  AnalyticsOverview,
  SourceBreakdown,
  PipelineSummary,
  TimelinePoint,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ── Token Management ──
function getTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("tokens");
  return raw ? JSON.parse(raw) : null;
}

function setTokens(tokens: AuthTokens) {
  localStorage.setItem("tokens", JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem("tokens");
}

// ── Interceptors ──
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getTokens();
  if (tokens?.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const tokens = getTokens();
      if (tokens?.refresh_token) {
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: tokens.refresh_token,
          });
          setTokens(res.data);
          original.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(original);
        } catch {
          clearTokens();
          window.location.href = "/login";
        }
      } else {
        clearTokens();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const auth = {
  register: async (data: RegisterRequest) => {
    const res = await api.post<AuthTokens>("/auth/register", data);
    setTokens(res.data);
    return res.data;
  },
  login: async (data: LoginRequest) => {
    const res = await api.post<AuthTokens>("/auth/login", data);
    setTokens(res.data);
    return res.data;
  },
  me: async () => {
    const res = await api.get<User>("/auth/me");
    return res.data;
  },
  logout: () => {
    clearTokens();
  },
  isAuthenticated: () => !!getTokens()?.access_token,
};

// ── Leads ──
export const leads = {
  list: async (params?: { page?: number; per_page?: number; search?: string; source?: string; stage_id?: string }) => {
    const res = await api.get<{ items: Lead[]; total: number }>("/leads", { params });
    return res.data.items;
  },
  get: async (id: string) => {
    const res = await api.get<Lead>(`/leads/${id}`);
    return res.data;
  },
  create: async (data: LeadCreate) => {
    const res = await api.post<Lead>("/leads", data);
    return res.data;
  },
  update: async (id: string, data: LeadUpdate) => {
    const res = await api.patch<Lead>(`/leads/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await api.delete(`/leads/${id}`);
  },
  moveStage: async (id: string, stage_id: string) => {
    const res = await api.post<Lead>(`/leads/${id}/move`, { stage_id });
    return res.data;
  },
  assign: async (id: string, user_id: string) => {
    const res = await api.post<Lead>(`/leads/${id}/assign`, { user_id });
    return res.data;
  },
  events: async (id: string) => {
    const res = await api.get<LeadEvent[]>(`/leads/${id}/events`);
    return res.data;
  },
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/leads/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  exportCsv: async () => {
    const res = await api.get("/leads/export", { responseType: "blob" });
    return res.data;
  },
};

// ── Pipelines ──
export const pipelines = {
  list: async () => {
    const res = await api.get<Pipeline[]>("/pipelines");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<Pipeline>(`/pipelines/${id}`);
    return res.data;
  },
  create: async (data: { name: string }) => {
    const res = await api.post<Pipeline>("/pipelines", data);
    return res.data;
  },
  addStage: async (pipelineId: string, data: PipelineStageCreate) => {
    const res = await api.post<PipelineStage>(`/pipelines/${pipelineId}/stages`, data);
    return res.data;
  },
  updateStage: async (pipelineId: string, stageId: string, data: Partial<PipelineStageCreate>) => {
    const res = await api.patch<PipelineStage>(`/pipelines/${pipelineId}/stages/${stageId}`, data);
    return res.data;
  },
  deleteStage: async (pipelineId: string, stageId: string) => {
    await api.delete(`/pipelines/${pipelineId}/stages/${stageId}`);
  },
};

// ── Workflows ──
export const workflows = {
  list: async () => {
    const res = await api.get<Workflow[]>("/workflows");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<Workflow>(`/workflows/${id}`);
    return res.data;
  },
  create: async (data: WorkflowCreate) => {
    const res = await api.post<Workflow>("/workflows", data);
    return res.data;
  },
  update: async (id: string, data: Partial<WorkflowCreate>) => {
    const res = await api.patch<Workflow>(`/workflows/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await api.delete(`/workflows/${id}`);
  },
  activate: async (id: string) => {
    const res = await api.post<Workflow>(`/workflows/${id}/activate`);
    return res.data;
  },
  deactivate: async (id: string) => {
    const res = await api.post<Workflow>(`/workflows/${id}/deactivate`);
    return res.data;
  },
  executions: async (id: string) => {
    const res = await api.get<WorkflowExecution[]>(`/workflows/${id}/executions`);
    return res.data;
  },
  trigger: async (id: string, lead_id: string) => {
    const res = await api.post(`/workflows/${id}/trigger`, { lead_id });
    return res.data;
  },
};

// ── Templates ──
export const templates = {
  list: async () => {
    const res = await api.get<MessageTemplate[]>("/templates");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<MessageTemplate>(`/templates/${id}`);
    return res.data;
  },
  create: async (data: TemplateCreate) => {
    const res = await api.post<MessageTemplate>("/templates", data);
    return res.data;
  },
  update: async (id: string, data: Partial<TemplateCreate>) => {
    const res = await api.patch<MessageTemplate>(`/templates/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await api.delete(`/templates/${id}`);
  },
  preview: async (id: string, lead_id: string) => {
    const res = await api.post<{ subject: string; body: string }>(`/templates/${id}/preview`, { lead_id });
    return res.data;
  },
};

// ── Tasks ──
export const tasks = {
  list: async (params?: { status?: string }) => {
    const res = await api.get<Task[]>("/tasks", { params });
    return res.data;
  },
  create: async (data: TaskCreate) => {
    const res = await api.post<Task>("/tasks", data);
    return res.data;
  },
  update: async (id: string, data: Partial<TaskCreate>) => {
    const res = await api.patch<Task>(`/tasks/${id}`, data);
    return res.data;
  },
  complete: async (id: string) => {
    const res = await api.post<Task>(`/tasks/${id}/complete`);
    return res.data;
  },
  delete: async (id: string) => {
    await api.delete(`/tasks/${id}`);
  },
};

// ── Analytics ──
export const analytics = {
  overview: async () => {
    const res = await api.get<AnalyticsOverview>("/analytics/overview");
    return res.data;
  },
  sources: async () => {
    const res = await api.get<SourceBreakdown[]>("/analytics/sources");
    return res.data;
  },
  pipeline: async () => {
    const res = await api.get<PipelineSummary[]>("/analytics/pipeline");
    return res.data;
  },
  timeline: async (params?: { days?: number }) => {
    const res = await api.get<TimelinePoint[]>("/analytics/timeline", { params });
    return res.data;
  },
};

// ── Integrations ──
export const integrations = {
  list: async () => {
    const res = await api.get<IntegrationConfig[]>("/integrations");
    return res.data;
  },
  create: async (data: { provider: string; credentials: Record<string, unknown>; settings?: Record<string, unknown> }) => {
    const res = await api.post<IntegrationConfig>("/integrations", data);
    return res.data;
  },
  update: async (id: string, data: Partial<{ credentials: Record<string, unknown>; settings: Record<string, unknown>; is_active: boolean }>) => {
    const res = await api.patch<IntegrationConfig>(`/integrations/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    await api.delete(`/integrations/${id}`);
  },
  test: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/integrations/${id}/test`);
    return res.data;
  },
};

// ── Team ──
export const team = {
  list: async () => {
    const res = await api.get<User[]>("/team");
    return res.data;
  },
  invite: async (data: { email: string; name: string; role: string }) => {
    const res = await api.post<User>("/team/invite", data);
    return res.data;
  },
  updateRole: async (userId: string, role: string) => {
    const res = await api.patch<User>(`/team/${userId}`, { role });
    return res.data;
  },
  deactivate: async (userId: string) => {
    const res = await api.post(`/team/${userId}/deactivate`);
    return res.data;
  },
};

export default api;
