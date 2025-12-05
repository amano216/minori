// API URL - use proxy in development, explicit URL in production
function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development, Vite proxy handles /api requests
  return '';
}

export function getFullApiUrl(path: string): string {
  return `${getApiUrl()}${path}`;
}

const API_URL = getApiUrl();
const TOKEN_KEY = 'minori_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// カスタムエラークラス
export class ApiError extends Error {
  status: number;
  errorType?: string;
  conflictType?: string;
  resourceId?: number;
  currentVersion?: number;
  errors: string[];

  constructor(
    message: string,
    status: number,
    errors: string[] = [],
    extra?: {
      error_type?: string;
      conflict_type?: string;
      resource_id?: number;
      current_version?: number;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.errorType = extra?.error_type;
    this.conflictType = extra?.conflict_type;
    this.resourceId = extra?.resource_id;
    this.currentVersion = extra?.current_version;
  }

  isConflict(): boolean {
    return this.status === 409;
  }

  isDoubleBooking(): boolean {
    return this.errorType === 'double_booking';
  }

  isPatientDoubleBookingWarning(): boolean {
    return this.errorType === 'patient_double_booking_warning';
  }

  isStaleObject(): boolean {
    return this.errorType === 'stale_object';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    
    // 409 Conflictの場合は詳細情報を含むApiErrorをthrow
    if (response.status === 409) {
      throw new ApiError(
        errorData.errors?.[0] || 'Conflict error',
        response.status,
        errorData.errors || [],
        {
          error_type: errorData.error_type,
          conflict_type: errorData.conflict_type,
          resource_id: errorData.resource_id,
          current_version: errorData.current_version,
        }
      );
    }
    
    throw new ApiError(
      errorData.error || errorData.errors?.[0] || 'Request failed',
      response.status,
      errorData.errors || []
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export interface User {
  id: number;
  email: string;
  role: string;
  otp_enabled?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  return apiRequest('/api/health');
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(response.token);
  return response;
}

export async function logout(): Promise<void> {
  await apiRequest('/api/auth/logout', { method: 'DELETE' });
  removeToken();
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  return apiRequest('/api/auth/me');
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// 2FA toggle
export interface Toggle2FAResponse {
  otp_enabled: boolean;
  message: string;
}

export async function toggle2FA(): Promise<Toggle2FAResponse> {
  return apiRequest('/api/auth/toggle-2fa', {
    method: 'POST',
  });
}

// Staff API (Userモデルに統合済み - 後方互換性のためStaff APIを維持)
export interface Staff {
  id: number;
  name: string;
  email: string;
  qualifications: string[];
  available_hours: Record<string, { start: string; end: string }>;
  status: 'active' | 'inactive' | 'on_leave';
  staff_status?: 'active' | 'inactive' | 'on_leave'; // バックエンドからの応答用
  created_at: string;
  updated_at: string;
  group_id?: number | null;
}

export interface StaffInput {
  name: string;
  email: string;
  qualifications?: string[];
  available_hours?: Record<string, { start: string; end: string }>;
  status?: string;
  staff_status?: string;
  group_id?: number | null;
}

export async function fetchStaffs(params?: { status?: string; qualification?: string }): Promise<Staff[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.qualification) query.append('qualification', params.qualification);
  const queryString = query.toString();
  const staffs = await apiRequest<Staff[]>(`/api/staffs${queryString ? `?${queryString}` : ''}`);
  // staff_status を status にマッピング
  return staffs.map(s => ({ ...s, status: s.staff_status || s.status }));
}

export async function fetchStaff(id: number): Promise<Staff> {
  const staff = await apiRequest<Staff>(`/api/staffs/${id}`);
  return { ...staff, status: staff.staff_status || staff.status };
}

export async function createStaff(staff: StaffInput): Promise<Staff> {
  // status を staff_status にマッピング
  const input = { ...staff, staff_status: staff.status || staff.staff_status };
  delete (input as Record<string, unknown>).status;
  const result = await apiRequest<Staff>('/api/staffs', {
    method: 'POST',
    body: JSON.stringify({ staff: input }),
  });
  return { ...result, status: result.staff_status || result.status };
}

export async function updateStaff(id: number, staff: Partial<StaffInput>): Promise<Staff> {
  // status を staff_status にマッピング
  const input = { ...staff };
  if (input.status) {
    (input as Record<string, unknown>).staff_status = input.status;
    delete (input as Record<string, unknown>).status;
  }
  const result = await apiRequest<Staff>(`/api/staffs/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ staff: input }),
  });
  return { ...result, status: result.staff_status || result.status };
}

export async function deleteStaff(id: number): Promise<void> {
  return apiRequest(`/api/staffs/${id}`, { method: 'DELETE' });
}

// Group API
export interface Group {
  id: number;
  name: string;
  status: string;
  position?: number | null;
  created_at: string;
  updated_at: string;
  users?: User[];
  parent_id?: number | null;
  parent_name?: string | null;
  group_type?: 'office' | 'team';
  children?: Group[];
}

export async function fetchGroups(params?: { status?: string }): Promise<Group[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  const queryString = query.toString();
  return apiRequest(`/api/groups${queryString ? `?${queryString}` : ''}`);
}

export async function reorderGroups(groupIds: number[]): Promise<{ success: boolean }> {
  return apiRequest('/api/groups/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ group_ids: groupIds }),
  });
}

// Admin Group API (full permissions)
export async function fetchAdminGroups(params?: { status?: string }): Promise<Group[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  const queryString = query.toString();
  return apiRequest(`/api/admin/groups${queryString ? `?${queryString}` : ''}`);
}

// Patient API
export interface PhoneNumber {
  number: string;
  label?: string;
}

export interface ExternalUrl {
  url: string;
  label?: string;
}

export interface PatientGroup {
  id: number;
  name: string;
  group_type?: 'office' | 'team';
}

export interface Patient {
  id: number;
  name: string;
  name_kana?: string;
  postal_code?: string;
  address?: string;
  phone_numbers: PhoneNumber[];
  external_urls: ExternalUrl[];
  date_of_birth?: string;
  gender?: string;
  age?: number;
  patient_code?: string;
  group_id?: number;
  group?: PatientGroup;
  care_requirements: string[];
  notes?: string;
  status: 'active' | 'hospitalized' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PatientInput {
  name: string;
  name_kana?: string;
  postal_code?: string;
  address?: string;
  phone_numbers?: PhoneNumber[];
  external_urls?: ExternalUrl[];
  date_of_birth?: string;
  gender?: string;
  patient_code?: string;
  group_id?: number;
  care_requirements?: string[];
  notes?: string;
  status?: string;
}

export async function fetchPatients(params?: { status?: string; care_requirement?: string }): Promise<Patient[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.care_requirement) query.append('care_requirement', params.care_requirement);
  const queryString = query.toString();
  return apiRequest(`/api/patients${queryString ? `?${queryString}` : ''}`);
}

export async function fetchPatient(id: number): Promise<Patient> {
  return apiRequest(`/api/patients/${id}`);
}

export async function createPatient(patient: PatientInput): Promise<Patient> {
  return apiRequest('/api/patients', {
    method: 'POST',
    body: JSON.stringify({ patient }),
  });
}

export async function updatePatient(id: number, patient: Partial<PatientInput>): Promise<Patient> {
  return apiRequest(`/api/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ patient }),
  });
}

export async function deletePatient(id: number): Promise<void> {
  return apiRequest(`/api/patients/${id}`, { method: 'DELETE' });
}

// Visit API
export type PatientStatus = 'active' | 'hospitalized' | 'inactive';

export interface Visit {
  id: number;
  scheduled_at: string;
  duration: number;
  staff_id: number | null;
  patient_id: number;
  staff: { id: number; name: string } | null;
  patient: { id: number; name: string; address?: string; external_urls?: ExternalUrl[]; status?: PatientStatus };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'unassigned';
  notes: string;
  created_at: string;
  updated_at: string;
  planning_lane_id?: number | null;
  lock_version?: number;
}

export interface VisitInput {
  scheduled_at: string;
  duration?: number;
  staff_id?: number | null;
  patient_id: number;
  status?: string;
  notes?: string;
  planning_lane_id?: number | null;
  lock_version?: number;
  skip_patient_conflict_check?: boolean;
}

export async function fetchVisits(params?: {
  status?: string;
  staff_id?: number;
  patient_id?: number;
  date?: string;
}): Promise<Visit[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.staff_id) query.append('staff_id', params.staff_id.toString());
  if (params?.patient_id) query.append('patient_id', params.patient_id.toString());
  if (params?.date) query.append('date', params.date);
  const queryString = query.toString();
  return apiRequest(`/api/visits${queryString ? `?${queryString}` : ''}`);
}

export async function fetchVisit(id: number): Promise<Visit> {
  return apiRequest(`/api/visits/${id}`);
}

export async function createVisit(visit: VisitInput): Promise<Visit> {
  return apiRequest('/api/visits', {
    method: 'POST',
    body: JSON.stringify({ visit }),
  });
}

export async function updateVisit(id: number, visit: Partial<VisitInput>): Promise<Visit> {
  return apiRequest(`/api/visits/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ visit }),
  });
}

export async function deleteVisit(id: number): Promise<void> {
  return apiRequest(`/api/visits/${id}`, { method: 'DELETE' });
}

export async function cancelVisit(id: number): Promise<Visit> {
  return apiRequest(`/api/visits/${id}/cancel`, { method: 'PATCH' });
}

export async function completeVisit(id: number): Promise<Visit> {
  return apiRequest(`/api/visits/${id}/complete`, { method: 'PATCH' });
}

// Schedule API
export interface ScheduleVisit extends Visit {
  patient: { id: number; name: string; address?: string; status?: PatientStatus; group?: { id: number; name: string } };
}

export interface DailySchedule {
  date: string;
  visits: ScheduleVisit[];
}

export interface WeeklySchedule {
  start_date: string;
  end_date: string;
  days: Record<string, ScheduleVisit[]>;
}

export interface StaffSchedule {
  staff: {
    id: number;
    name: string;
    qualifications: string[];
    available_hours: Record<string, { start: string; end: string }>;
  };
  start_date: string;
  end_date: string;
  visits: ScheduleVisit[];
}

export interface ScheduleSummary {
  start_date: string;
  end_date: string;
  total_visits: number;
  by_status: {
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    unassigned: number;
  };
  unassigned_visits: number;
}

export async function fetchDailySchedule(params?: {
  date?: string;
  staff_id?: number;
}): Promise<DailySchedule> {
  const query = new URLSearchParams();
  if (params?.date) query.append('date', params.date);
  if (params?.staff_id) query.append('staff_id', params.staff_id.toString());
  const queryString = query.toString();
  return apiRequest(`/api/schedules/daily${queryString ? `?${queryString}` : ''}`);
}

export async function fetchWeeklySchedule(params?: {
  start_date?: string;
  staff_id?: number;
}): Promise<WeeklySchedule> {
  const query = new URLSearchParams();
  if (params?.start_date) query.append('start_date', params.start_date);
  if (params?.staff_id) query.append('staff_id', params.staff_id.toString());
  const queryString = query.toString();
  return apiRequest(`/api/schedules/weekly${queryString ? `?${queryString}` : ''}`);
}

export async function fetchStaffSchedule(
  staffId: number,
  params?: { start_date?: string; end_date?: string }
): Promise<StaffSchedule> {
  const query = new URLSearchParams();
  if (params?.start_date) query.append('start_date', params.start_date);
  if (params?.end_date) query.append('end_date', params.end_date);
  const queryString = query.toString();
  return apiRequest(`/api/schedules/staff/${staffId}${queryString ? `?${queryString}` : ''}`);
}

export async function fetchScheduleSummary(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<ScheduleSummary> {
  const query = new URLSearchParams();
  if (params?.start_date) query.append('start_date', params.start_date);
  if (params?.end_date) query.append('end_date', params.end_date);
  const queryString = query.toString();
  return apiRequest(`/api/schedules/summary${queryString ? `?${queryString}` : ''}`);
}

// Gantt Schedule API
export interface GanttVisit {
  id: number;
  scheduled_at: string;
  duration: number;
  status: string;
  notes: string;
  patient: { id: number; name: string; address?: string };
  staff_id: number | null;
}

export interface StaffRow {
  staff: { id: number; name: string; status: string };
  visits: GanttVisit[];
}

export interface GanttSchedule {
  date: string;
  staff_rows: StaffRow[];
  unassigned_visits: GanttVisit[];
}

export async function fetchGanttSchedule(params?: {
  date?: string;
}): Promise<GanttSchedule> {
  const query = new URLSearchParams();
  if (params?.date) query.append('date', params.date);
  const queryString = query.toString();
  return apiRequest(`/api/schedules/gantt${queryString ? `?${queryString}` : ''}`);
}

export async function reassignVisit(id: number, staffId: number | null): Promise<Visit> {
  return apiRequest(`/api/visits/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ visit: { staff_id: staffId } }),
  });
}

// Planning Lane API
export interface PlanningLane {
  id: number;
  name: string;
  pattern_name?: string | null;
  position: number;
  organization_id: number;
  group_id?: number | null;
  archived_at?: string | null;
}

export async function fetchPlanningLanes(): Promise<PlanningLane[]> {
  return apiRequest('/api/planning_lanes');
}

export async function createPlanningLane(name: string, position: number, groupId?: number | null): Promise<PlanningLane> {
  return apiRequest('/api/planning_lanes', {
    method: 'POST',
    body: JSON.stringify({ planning_lane: { name, position, group_id: groupId } }),
  });
}

export async function updatePlanningLane(
  id: number,
  name: string,
  groupId?: number | null,
  patternName?: string | null
): Promise<PlanningLane> {
  const body: { name: string; group_id?: number | null; pattern_name?: string | null } = { name };
  if (groupId !== undefined) {
    body.group_id = groupId;
  }
  if (patternName !== undefined) {
    body.pattern_name = patternName;
  }
  return apiRequest(`/api/planning_lanes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ planning_lane: body }),
  });
}

// Update only the pattern_name field
export async function updatePlanningLanePatternName(id: number, patternName: string | null): Promise<PlanningLane> {
  return apiRequest(`/api/planning_lanes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ planning_lane: { pattern_name: patternName } }),
  });
}

// Update only the name field
export async function updatePlanningLaneName(id: number, name: string): Promise<PlanningLane> {
  return apiRequest(`/api/planning_lanes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ planning_lane: { name } }),
  });
}

export async function deletePlanningLane(id: number): Promise<void> {
  return apiRequest(`/api/planning_lanes/${id}`, { method: 'DELETE' });
}

export async function archivePlanningLane(id: number): Promise<PlanningLane> {
  return apiRequest(`/api/planning_lanes/${id}/archive`, { method: 'PATCH' });
}

export async function unarchivePlanningLane(id: number): Promise<PlanningLane> {
  return apiRequest(`/api/planning_lanes/${id}/unarchive`, { method: 'PATCH' });
}

// Axios-like API client for organization API
export const api = {
  get: async <T>(endpoint: string): Promise<{ data: T }> => {
    const data = await apiRequest<T>(`/api${endpoint}`);
    return { data };
  },

  post: async <T>(endpoint: string, body?: unknown): Promise<{ data: T }> => {
    const data = await apiRequest<T>(`/api${endpoint}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },

  put: async <T>(endpoint: string, body?: unknown): Promise<{ data: T }> => {
    const data = await apiRequest<T>(`/api${endpoint}`, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },

  delete: async <T = void>(endpoint: string): Promise<{ data: T }> => {
    const data = await apiRequest<T>(`/api${endpoint}`, {
      method: 'DELETE',
    });
    return { data };
  },
};

// Visit Pattern API (計画モード)
export type PatternFrequency = 'weekly' | 'biweekly' | 'monthly_1_3' | 'monthly_2_4';

export interface VisitPattern {
  id: number;
  planning_lane_id: number | null;
  patient_id: number;
  default_staff_id: number | null;
  day_of_week: number;
  day_name: string;
  start_time: string;
  duration: number;
  frequency: PatternFrequency;
  patient: { id: number; name: string; address?: string; status?: PatientStatus } | null;
  staff: { id: number; name: string } | null;
  planning_lane: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface VisitPatternInput {
  planning_lane_id?: number | null;
  patient_id: number;
  default_staff_id?: number | null;
  day_of_week: number;
  start_time: string;
  duration?: number;
  frequency?: PatternFrequency;
}

export async function fetchVisitPatterns(params?: {
  day_of_week?: number;
  planning_lane_id?: number;
}): Promise<VisitPattern[]> {
  const query = new URLSearchParams();
  if (params?.day_of_week !== undefined) query.append('day_of_week', String(params.day_of_week));
  if (params?.planning_lane_id) query.append('planning_lane_id', String(params.planning_lane_id));
  const queryString = query.toString();
  return apiRequest(`/api/visit_patterns${queryString ? `?${queryString}` : ''}`);
}

export async function fetchVisitPattern(id: number): Promise<VisitPattern> {
  return apiRequest(`/api/visit_patterns/${id}`);
}

export async function createVisitPattern(body: VisitPatternInput): Promise<VisitPattern> {
  return apiRequest('/api/visit_patterns', {
    method: 'POST',
    body: JSON.stringify({ visit_pattern: body }),
  });
}

export async function updateVisitPattern(id: number, body: Partial<VisitPatternInput>): Promise<VisitPattern> {
  return apiRequest(`/api/visit_patterns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ visit_pattern: body }),
  });
}

export async function deleteVisitPattern(id: number): Promise<void> {
  return apiRequest(`/api/visit_patterns/${id}`, { method: 'DELETE' });
}

export interface GenerateVisitsResult {
  message: string;
  count: number;
  visits: Array<{
    id: number;
    scheduled_at: string;
    patient: { id: number; name: string } | null;
    staff: { id: number; name: string } | null;
    status: string;
  }>;
}

export async function generateVisitsFromPatterns(
  startDate: string,
  endDate: string,
  dayOfWeeks?: number[]
): Promise<GenerateVisitsResult> {
  return apiRequest('/api/visit_patterns/generate_visits', {
    method: 'POST',
    body: JSON.stringify({ 
      start_date: startDate, 
      end_date: endDate,
      day_of_weeks: dayOfWeeks 
    }),
  });
}

// Event API (ミーティング・施設訪問など)
export type EventType = 'meeting' | 'facility' | 'training' | 'other' | 'absence';
export type AbsenceReason = 'compensatory_leave' | 'paid_leave' | 'half_day_leave';
export type ParticipantStatus = 'confirmed' | 'tentative' | 'declined';

export interface EventParticipant {
  id: number;
  name: string;
  status: ParticipantStatus;
}

export interface ScheduleEvent {
  id: number;
  title: string;
  event_type: EventType;
  absence_reason: AbsenceReason | null;
  scheduled_at: string;
  duration: number;
  notes: string | null;
  planning_lane_id: number | null;
  planning_lane: { id: number; name: string } | null;
  participant_ids: number[];
  participants: EventParticipant[];
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title: string;
  event_type: EventType;
  scheduled_at: string;
  duration?: number;
  notes?: string;
  planning_lane_id?: number | null;
  participant_ids?: number[];
  absence_reason?: AbsenceReason;
}

export async function fetchEvents(params?: {
  date?: string;
  start_date?: string;
  end_date?: string;
  staff_id?: number;
  planning_lane_id?: number;
}): Promise<ScheduleEvent[]> {
  const query = new URLSearchParams();
  if (params?.date) query.append('date', params.date);
  if (params?.start_date) query.append('start_date', params.start_date);
  if (params?.end_date) query.append('end_date', params.end_date);
  if (params?.staff_id) query.append('staff_id', String(params.staff_id));
  if (params?.planning_lane_id) query.append('planning_lane_id', String(params.planning_lane_id));
  const queryString = query.toString();
  return apiRequest(`/api/events${queryString ? `?${queryString}` : ''}`);
}

export async function fetchEvent(id: number): Promise<ScheduleEvent> {
  return apiRequest(`/api/events/${id}`);
}

export async function createEvent(event: EventInput): Promise<ScheduleEvent> {
  return apiRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify({ event }),
  });
}

export async function updateEvent(id: number, event: Partial<EventInput>): Promise<ScheduleEvent> {
  return apiRequest(`/api/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ event }),
  });
}

export async function deleteEvent(id: number): Promise<void> {
  return apiRequest(`/api/events/${id}`, { method: 'DELETE' });
}
