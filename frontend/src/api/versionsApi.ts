// Audit Log API（3省2ガイドライン準拠）
// 監査ログの取得用API

export interface AuditVersion {
  id: number;
  item_type: 'Patient' | 'Visit';
  item_id: number;
  event: 'create' | 'update' | 'destroy';
  event_label: string;
  whodunnit: string | null;
  whodunnit_name: string | null;
  whodunnit_role: string | null;
  ip_address: string | null;
  created_at: string;
  object?: Record<string, unknown>;
  object_changes?: Record<string, { before: unknown; after: unknown }>;
}

export interface AuditVersionsMeta {
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface AuditVersionsResponse {
  versions: AuditVersion[];
  meta: AuditVersionsMeta;
}

export interface AuditVersionDetailResponse {
  version: AuditVersion;
}

import { getToken } from './client';

const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || '';
};

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

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || 'Request failed');
  }

  return response.json();
}

/**
 * 監査ログの一覧を取得
 */
export async function fetchVersions(params?: {
  item_type?: 'Patient' | 'Visit';
  item_id?: number;
  page?: number;
  per_page?: number;
}): Promise<AuditVersionsResponse> {
  const query = new URLSearchParams();
  if (params?.item_type) query.append('item_type', params.item_type);
  if (params?.item_id) query.append('item_id', String(params.item_id));
  if (params?.page) query.append('page', String(params.page));
  if (params?.per_page) query.append('per_page', String(params.per_page));
  const queryString = query.toString();
  return apiRequest<AuditVersionsResponse>(`/api/versions${queryString ? `?${queryString}` : ''}`);
}

/**
 * 監査ログの詳細を取得（変更差分を含む）
 */
export async function fetchVersionDetail(id: number): Promise<AuditVersionDetailResponse> {
  return apiRequest<AuditVersionDetailResponse>(`/api/versions/${id}`);
}
