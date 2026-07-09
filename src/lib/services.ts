import { apiRequest } from '@/lib/api';
import type { AuthData, User, UserType } from '@/types';

export async function loginRequest(identifier: string, password: string) {
  return apiRequest<AuthData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export async function registerRequest(payload: {
  name: string;
  mobile: string;
  email?: string;
  password: string;
}) {
  return apiRequest<AuthData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProfileRequest(token: string) {
  return apiRequest<User>('/auth/profile', { method: 'GET' }, token);
}

export async function updateProfileRequest(
  token: string,
  payload: { name?: string; mobile?: string; email?: string; password?: string },
) {
  return apiRequest<User>(
    '/auth/profile',
    { method: 'PUT', body: JSON.stringify(payload) },
    token,
  );
}

export async function getUserTypesRequest(token: string) {
  return apiRequest<UserType[]>('/admin/types', { method: 'GET' }, token);
}

export async function getAllUsersRequest(token: string) {
  return apiRequest<User[]>('/admin/users', { method: 'GET' }, token);
}

export async function updateUserRequest(
  token: string,
  userId: string,
  payload: { name?: string; mobile?: string; email?: string; password?: string },
) {
  return apiRequest<User>(
    `/admin/users/${userId}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    token,
  );
}

export async function updateUserTypeRequest(token: string, userId: string, userType: UserType) {
  return apiRequest<User>(
    `/admin/users/${userId}/type`,
    { method: 'PATCH', body: JSON.stringify({ userType }) },
    token,
  );
}

export async function deleteUserRequest(token: string, userId: string) {
  return apiRequest<User>(`/admin/users/${userId}`, { method: 'DELETE' }, token);
}
