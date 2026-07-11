import { apiFormRequest, apiRequest } from '@/lib/api';
import type {
  AdminDashboardStats,
  AuthData,
  BookedHistoryFilters,
  BookedHistoryItem,
  Booking,
  Car,
  CarBookingStatusItem,
  CarFilters,
  HistoryAction,
  PaginationMeta,
  UpdateCarBookingStatusResult,
  User,
  UserType,
} from '@/types';

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

export async function getAdminDashboardRequest(token: string) {
  return apiRequest<AdminDashboardStats>('/admin/dashboard', { method: 'GET' }, token);
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

export async function getAllBookingsAdminRequest(token: string) {
  return apiRequest<Booking[]>('/bookings/admin', { method: 'GET' }, token);
}

export async function getMyBookingsRequest(token: string) {
  return apiRequest<Booking[]>('/bookings/my', { method: 'GET' }, token);
}

export async function getMyBookingHistoryRequest(
  token: string,
  filters: { action?: HistoryAction | ''; page?: number; limit?: number } = {},
) {
  const params = new URLSearchParams();
  if (filters.action) params.set('action', filters.action);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  const endpoint = query ? `/bookings/history/my?${query}` : '/bookings/history/my';

  const res = (await apiRequest(endpoint, { method: 'GET' }, token)) as {
    success: boolean;
    data: BookedHistoryItem[];
    pagination: PaginationMeta;
  };
  return res;
}

export async function createBookingRequest(
  token: string,
  payload: { carId: string; carNumber: string; timing: string },
) {
  return apiRequest<Booking>(
    '/bookings',
    { method: 'POST', body: JSON.stringify(payload) },
    token,
  );
}

export async function cancelBookingRequest(token: string, bookingId: string) {
  return apiRequest<Booking>(`/bookings/${bookingId}/cancel`, { method: 'POST' }, token);
}

export async function getCarsBookingStatusRequest(token: string) {
  return apiRequest<CarBookingStatusItem[]>('/bookings/status', { method: 'GET' }, token);
}

export async function updateCarBookingStatusRequest(
  token: string,
  payload: {
    carId: string;
    carNumber: string;
    status: 'AVAILABLE' | 'NOT_AVAILABLE';
    timing?: string;
  },
) {
  return apiRequest<UpdateCarBookingStatusResult>(
    '/bookings/admin/status',
    { method: 'PUT', body: JSON.stringify(payload) },
    token,
  );
}

export async function getBookingHistoryAdminRequest(
  token: string,
  filters: BookedHistoryFilters = {},
) {
  const params = new URLSearchParams();

  if (filters.userName?.trim()) params.set('userName', filters.userName.trim());
  if (filters.userMobile?.trim()) params.set('userMobile', filters.userMobile.trim());
  if (filters.carNumber?.trim()) params.set('carNumber', filters.carNumber.trim());
  if (filters.carId?.trim()) params.set('carId', filters.carId.trim());
  if (filters.action) params.set('action', filters.action);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const endpoint = query ? `/bookings/history/admin?${query}` : '/bookings/history/admin';

  const res = (await apiRequest(endpoint, { method: 'GET' }, token)) as {
    success: boolean;
    data: BookedHistoryItem[];
    pagination: PaginationMeta;
  };

  return res;
}
