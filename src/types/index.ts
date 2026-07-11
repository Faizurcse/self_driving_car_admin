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

export interface PriceInfo {
  price: number | string;
  timing: string | number;
  description: string;
}

export interface ContactUsInfo {
  name?: string;
  mobile?: string;
  email?: string;
}

export interface Car {
  id: string;
  carNumber: string;
  carName: string;
  description: string;
  modelNo: string;
  mainImage: string;
  galleryImages: string[];
  ownerPrices?: PriceInfo | null;
  dealerPrices: PriceInfo;
  customerPrices: PriceInfo;
  contactUs?: ContactUsInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface CarFilters {
  carNumber?: string;
  carName?: string;
  description?: string;
  modelNo?: string;
}
