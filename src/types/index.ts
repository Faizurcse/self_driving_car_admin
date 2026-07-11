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

export type BookingStatus = 'AVAILABLE' | 'NOT_AVAILABLE';

export interface Booking {
  id: string;
  carId: string;
  carNumber: string;
  userId: string;
  timing: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  car?: Car;
  user?: Pick<User, 'id' | 'name' | 'mobile' | 'email' | 'userType'>;
}

export type HistoryAction = 'COMPLETED' | 'CANCELLED';

export interface BookedHistoryItem {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  carId: string;
  carNumber: string;
  carName: string;
  action: HistoryAction;
  carJson: Car;
  bookingJson: Booking & { user?: Pick<User, 'id' | 'name' | 'mobile' | 'email' | 'userType'> };
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'mobile' | 'email' | 'userType'>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BookedHistoryFilters {
  userName?: string;
  userMobile?: string;
  carNumber?: string;
  carId?: string;
  action?: HistoryAction | '';
  page?: number;
  limit?: number;
}

export interface CarBookingStatusItem {
  carId: string;
  carNumber: string;
  carName: string;
  modelNo: string;
  mainImage: string;
  status: BookingStatus;
  isBooked: boolean;
  rentalHours: string;
  bookedTiming?: string;
  bookedBy?: {
    bookingId: string;
    userId: string;
    timing: string;
    user: Pick<User, 'id' | 'name' | 'mobile' | 'email' | 'userType'>;
  };
}

export interface UpdateCarBookingStatusResult {
  carId: string;
  carNumber: string;
  carName: string;
  status: BookingStatus;
  isBooked: boolean;
  message: string;
  booking?: Booking;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    customers: number;
    dealers: number;
    admins: number;
  };
  cars: {
    total: number;
    available: number;
    booked: number;
  };
  bookings: {
    active: number;
    completed: number;
    cancelled: number;
    total: number;
  };
  earnings: {
    total: number;
    currency: string;
  };
  periods: {
    today: AdminDashboardPeriodStats;
    days15: AdminDashboardPeriodStats;
    days30: AdminDashboardPeriodStats;
    year1: AdminDashboardPeriodStats;
  };
  charts: {
    usersByType: AdminDashboardChartItem[];
    carsByStatus: AdminDashboardChartItem[];
    bookingsByStatus: AdminDashboardChartItem[];
    earningsByPeriod: Array<{ label: string; value: number }>;
    bookingsByPeriod: Array<{
      label: string;
      completed: number;
      cancelled: number;
      total: number;
    }>;
  };
  recentActiveBookings: Array<{
    id: string;
    carId: string;
    carNumber: string;
    carName: string | null;
    timing: string;
    createdAt: string;
    user?: Pick<User, 'id' | 'name' | 'mobile' | 'email' | 'userType'>;
  }>;
  recentHistory: Array<{
    id: string;
    carId: string;
    carNumber: string;
    carName: string;
    action: HistoryAction;
    userName: string;
    userMobile: string;
    amount: number;
    createdAt: string;
    user?: Pick<User, 'id' | 'name' | 'mobile' | 'email' | 'userType'>;
  }>;
}

export interface AdminDashboardPeriodStats {
  earnings: number;
  bookings: {
    completed: number;
    cancelled: number;
    total: number;
  };
}

export interface AdminDashboardChartItem {
  label: string;
  value: number;
  color?: string;
}
