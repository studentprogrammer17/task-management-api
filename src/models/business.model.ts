import { BUSINESS_STATUS } from '../enums/business-status.enum';

export interface Business {
  id: string;
  name: string;
  employeeCount: number;
  phoneNumber: string;
  email: string;
  country: string;
  city: string;
  ownerFullName: string;
  description?: string;
  image?: string;
  userId: string;
  status: BUSINESS_STATUS;
  createdAt: string;
}

export type CreateBusinessDto = Omit<
  Business,
  'id' | 'createdAt' | 'status' | 'userId' | 'ownerFullName'
>;
export type UpdateBusinessDto = Partial<CreateBusinessDto>;
