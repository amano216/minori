import { api } from './client';
import type { Organization, User, Role, Group } from '../types/organization';

export const organizationApi = {
  // Organization
  getOrganization: async (): Promise<Organization> => {
    const response = await api.get<Organization>('/organization');
    return response.data as Organization;
  },

  updateOrganization: async (data: Partial<Organization>): Promise<Organization> => {
    const response = await api.put<Organization>('/organization', { organization: data });
    return response.data as Organization;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users');
    return response.data as User[];
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const response = await api.post<User>('/admin/users', { user: data });
    return response.data as User;
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/admin/users/${id}`, { user: data });
    return response.data as User;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // Roles
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/admin/roles');
    return response.data as Role[];
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    const response = await api.post<Role>('/admin/roles', { role: data });
    return response.data as Role;
  },

  updateRole: async (id: number, data: Partial<Role>): Promise<Role> => {
    const response = await api.put<Role>(`/admin/roles/${id}`, { role: data });
    return response.data as Role;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/admin/roles/${id}`);
  },

  // Groups
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/admin/groups');
    return response.data as Group[];
  },

  createGroup: async (data: Partial<Group>): Promise<Group> => {
    const response = await api.post<Group>('/admin/groups', { group: data });
    return response.data as Group;
  },

  updateGroup: async (id: number, data: Partial<Group>): Promise<Group> => {
    const response = await api.put<Group>(`/admin/groups/${id}`, { group: data });
    return response.data as Group;
  },

  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/admin/groups/${id}`);
  },
};
