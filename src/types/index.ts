export type UserType = 'ADMIN' | 'DEALER' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  userType: UserType;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthData {
  user: User;
  accessToken: string;
}
