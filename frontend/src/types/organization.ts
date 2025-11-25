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
  roles?: Role[];
  groups?: Group[];
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
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
}
