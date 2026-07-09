import type { UserType } from '@/types';

const userTypeLabels: Record<UserType, string> = {
  ADMIN: 'Owner',
  DEALER: 'Dealer',
  CUSTOMER: 'Customer',
};

export function formatUserType(type: UserType): string {
  return userTypeLabels[type];
}
