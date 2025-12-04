export interface Organization {
  id: number;
  name: string;
  subdomain: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  organization_id?: number;
  groups?: Group[];
  // スタッフ属性（Staffモデル統合後）
  qualifications?: string[];
  available_hours?: Record<string, { start: string; end: string }>;
  staff_status?: 'active' | 'inactive' | 'on_leave';
  group_id?: number | null;
  // 2FAステータス（管理者のみ閲覧可能）
  otp_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  users?: User[];
  created_at: string;
  updated_at: string;
  parent_id?: number | null;
  group_type?: 'office' | 'team';
  children?: Group[];
}
