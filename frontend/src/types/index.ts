// ── Auth ──
export interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
  tenant_id: string;
  is_active: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  setup_completed: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  business_name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  password: string;
}

// ── Leads ──
export interface Lead {
  id: string;
  tenant_id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  score: number;
  stage_id: string | null;
  assigned_to: string | null;
  custom_fields: Record<string, unknown>;
  is_duplicate: boolean;
  opted_out: boolean;
  qualification_status: "pending" | "qualified" | "disqualified" | "needs_review" | "in_sequence" | "responded" | "closed" | "unresponsive";
  created_at: string;
  updated_at: string;
}

export interface LeadEvent {
  id: string;
  lead_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LeadCreate {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  source?: string;
  custom_fields?: Record<string, unknown>;
}

export interface LeadUpdate {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  source?: string;
  custom_fields?: Record<string, unknown>;
}

// ── Pipelines ──
export interface Pipeline {
  id: string;
  tenant_id: string;
  name: string;
  is_default: boolean;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  is_terminal: boolean;
}

export interface PipelineStageCreate {
  name: string;
  position: number;
  is_terminal?: boolean;
}

// ── Workflows ──
export interface Workflow {
  id: string;
  tenant_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  position: number;
  step_type: "send_email" | "send_sms" | "delay" | "condition" | "move_stage" | "assign" | "create_task";
  config: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  lead_id: string;
  current_step: number;
  status: "running" | "completed" | "failed" | "paused";
  next_run_at: string | null;
  created_at: string;
}

export interface WorkflowCreate {
  name: string;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  steps: WorkflowStepCreate[];
}

export interface WorkflowStepCreate {
  position: number;
  step_type: string;
  config: Record<string, unknown>;
}

// ── Templates ──
export interface MessageTemplate {
  id: string;
  tenant_id: string;
  name: string;
  channel: "email" | "sms";
  subject: string | null;
  body: string;
  is_active: boolean;
}

export interface TemplateCreate {
  name: string;
  channel: "email" | "sms";
  subject?: string;
  body: string;
}

// ── Tasks ──
export interface Task {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  status: "pending" | "completed";
  created_at: string;
}

export interface TaskCreate {
  lead_id?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  due_at?: string;
}

// ── Integrations ──
export interface IntegrationConfig {
  id: string;
  tenant_id: string;
  provider: string;
  credentials: Record<string, unknown>;
  settings: Record<string, unknown>;
  is_active: boolean;
}

// ── Analytics ──
export interface AnalyticsOverview {
  total_leads: number;
  leads_today: number;
  leads_this_week: number;
  leads_this_month: number;
  avg_score: number;
  conversion_rate: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  avg_score: number;
}

export interface PipelineSummary {
  stage_name: string;
  count: number;
  is_terminal: boolean;
}

export interface TimelinePoint {
  date: string;
  count: number;
}

// ── Onboarding ──
export type BusinessType = "products" | "services";
export type Cadence = "aggressive" | "normal" | "gentle";
export type BusinessGoal = "book_call" | "convert_direct";
export type TargetAudience = "homeowners" | "small_business" | "enterprise" | "consumers";

export interface SequenceMessage {
  id: string;
  label: string;
  channel: "email" | "sms";
  enabled: boolean;
  delayMinutes: number;
  subject: string;
  body: string;
}

export interface AppointmentReminder {
  enabled: boolean;
  minutesBefore: number;
  subject: string;
  body: string;
}

export interface WizardData {
  businessType: BusinessType | null;
  productName: string;
  productDescription: string;
  websiteUrl: string;
  companyName: string;
  industry: string;
  whatYouSell: string;
  targetAudience: TargetAudience | null;
  goal: BusinessGoal | null;
  responseSpeed: "instant" | "fast" | "same_day" | null;
  cadence: Cadence | null;
  sequence: SequenceMessage[];
  leadSource: "webhook" | "meta" | "manual" | null;
  appointmentReminder: AppointmentReminder | null;
  calendarLink: string;
  audienceType: "everyone" | "specific" | null;
  selectedAudiences: string[];
  leadSources: string[];
  qualificationRules: string[];
  fromName: string;
}

// ── Business Analysis ──
export interface BusinessAnalysis {
  business_description: string;
  primary_audience: string;
  message_style: string;
  what_you_sell: string;
  business_type: string;
  url_accessible: boolean;
  detected_site_name?: string;
}

// ── Common ──
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApiError {
  detail: string;
}
