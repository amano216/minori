// API URL - use proxy in development, explicit URL in production
function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development, Vite proxy handles /api requests
  return '';
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
}

export interface StaffInput {
  name: string;
  email: string;
  qualifications?: string[];
  available_hours?: Record<string, { start: string; end: string }>;
  status?: string;
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
