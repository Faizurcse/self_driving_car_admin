import { apiFormRequest, apiRequest } from '@/lib/api';
import type { AuthData, Car, CarFilters, User, UserType } from '@/types';

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

export async function getAllUsersRequest(
  token: string,
  filters: {
    name?: string;
    email?: string;
    mobile?: string;
    userType?: UserType | '';
  } = {},
) {
  const params = new URLSearchParams();

  if (filters.name?.trim()) params.set('name', filters.name.trim());
  if (filters.email?.trim()) params.set('email', filters.email.trim());
  if (filters.mobile?.trim()) params.set('mobile', filters.mobile.trim());
  if (filters.userType) params.set('userType', filters.userType);

  const query = params.toString();
  const endpoint = query ? `/admin/users?${query}` : '/admin/users';

  return apiRequest<User[]>(endpoint, { method: 'GET' }, token);
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

export async function getAdminCarsRequest(token: string, filters: CarFilters = {}) {
  const params = new URLSearchParams();

  if (filters.carNumber?.trim()) params.set('carNumber', filters.carNumber.trim());
  if (filters.carName?.trim()) params.set('carName', filters.carName.trim());
  if (filters.description?.trim()) params.set('description', filters.description.trim());
  if (filters.modelNo?.trim()) params.set('modelNo', filters.modelNo.trim());

  const query = params.toString();
  const endpoint = query ? `/cars/admin?${query}` : '/cars/admin';

  return apiRequest<Car[]>(endpoint, { method: 'GET' }, token);
}

export async function getAdminCarByIdRequest(token: string, carId: string) {
  return apiRequest<Car>(`/cars/admin/${carId}`, { method: 'GET' }, token);
}

export async function createCarRequest(token: string, formData: FormData) {
  return apiFormRequest<Car>('/cars', formData, token, 'POST');
}

export async function updateCarRequest(token: string, carId: string, formData: FormData) {
  return apiFormRequest<Car>(`/cars/${carId}`, formData, token, 'PUT');
}

export async function deleteCarRequest(token: string, carId: string) {
  return apiRequest<Car>(`/cars/${carId}`, { method: 'DELETE' }, token);
}
