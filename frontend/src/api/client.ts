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
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
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

// Staff API
export interface Staff {
  id: number;
  name: string;
  email: string;
  qualifications: string[];
  available_hours: Record<string, { start: string; end: string }>;
  status: 'active' | 'inactive' | 'on_leave';
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
  group_id?: number | null;
}

export async function fetchStaffs(params?: { status?: string; qualification?: string }): Promise<Staff[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.qualification) query.append('qualification', params.qualification);
  const queryString = query.toString();
  return apiRequest(`/api/staffs${queryString ? `?${queryString}` : ''}`);
}

export async function fetchStaff(id: number): Promise<Staff> {
  return apiRequest(`/api/staffs/${id}`);
}

export async function createStaff(staff: StaffInput): Promise<Staff> {
  return apiRequest('/api/staffs', {
    method: 'POST',
    body: JSON.stringify({ staff }),
  });
}

export async function updateStaff(id: number, staff: Partial<StaffInput>): Promise<Staff> {
  return apiRequest(`/api/staffs/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ staff }),
  });
}

export async function deleteStaff(id: number): Promise<void> {
  return apiRequest(`/api/staffs/${id}`, { method: 'DELETE' });
}

// Group API
export interface Group {
  id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  users?: User[];
  parent_id?: number | null;
  group_type?: 'office' | 'team';
  children?: Group[];
}

export async function fetchGroups(params?: { status?: string }): Promise<Group[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  const queryString = query.toString();
  return apiRequest(`/api/admin/groups${queryString ? `?${queryString}` : ''}`);
}

// Patient API
export interface Patient {
  id: number;
  name: string;
  address: string;
  phone: string;
  care_requirements: string[];
  notes: string;
  status: 'active' | 'inactive' | 'discharged';
  created_at: string;
  updated_at: string;
}

export interface PatientInput {
  name: string;
  address?: string;
  phone?: string;
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
export interface Visit {
  id: number;
  scheduled_at: string;
  duration: number;
  staff_id: number | null;
  patient_id: number;
  staff: { id: number; name: string } | null;
  patient: { id: number; name: string; address?: string };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'unassigned';
  notes: string;
  created_at: string;
  updated_at: string;
  planning_lane_id?: number | null;
}

export interface VisitInput {
  scheduled_at: string;
  duration?: number;
  staff_id?: number | null;
  patient_id: number;
  status?: string;
  notes?: string;
  planning_lane_id?: number | null;
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
  patient: { id: number; name: string; address?: string };
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
  position: number;
  organization_id: number;
}

export async function fetchPlanningLanes(): Promise<PlanningLane[]> {
  return apiRequest('/api/planning_lanes');
}

export async function createPlanningLane(name: string, position: number): Promise<PlanningLane> {
  return apiRequest('/api/planning_lanes', {
    method: 'POST',
    body: JSON.stringify({ planning_lane: { name, position } }),
  });
}

export async function updatePlanningLane(id: number, name: string): Promise<PlanningLane> {
  return apiRequest(`/api/planning_lanes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ planning_lane: { name } }),
  });
}

export async function deletePlanningLane(id: number): Promise<void> {
  return apiRequest(`/api/planning_lanes/${id}`, { method: 'DELETE' });
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
