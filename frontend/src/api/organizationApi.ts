import { api } from './client';
import type { Organization, User, Role, Group } from '../types/organization';

export const organizationApi = {
  // Organization
  getOrganization: async (): Promise<Organization> => {
    const response = await api.get('/organization');
    return response.data;
  },

  updateOrganization: async (data: Partial<Organization>): Promise<Organization> => {
    const response = await api.put('/organization', { organization: data });
    return response.data;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const response = await api.post('/admin/users', { user: data });
    return response.data;
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/admin/users/${id}`, { user: data });
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // Roles
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    const response = await api.post('/admin/roles', { role: data });
    return response.data;
  },

  updateRole: async (id: number, data: Partial<Role>): Promise<Role> => {
    const response = await api.put(`/admin/roles/${id}`, { role: data });
    return response.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/admin/roles/${id}`);
  },

  // Groups
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get('/admin/groups');
    return response.data;
  },

  createGroup: async (data: Partial<Group>): Promise<Group> => {
    const response = await api.post('/admin/groups', { group: data });
    return response.data;
  },

  updateGroup: async (id: number, data: Partial<Group>): Promise<Group> => {
    const response = await api.put(`/admin/groups/${id}`, { group: data });
    return response.data;
  },

  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/admin/groups/${id}`);
  },
};
