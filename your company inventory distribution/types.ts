
export type UserRole = 'Admin' | 'Manager' | 'Worker';

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  userId: string;
  password?: string; // For simulation purposes
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  productName: string;
  category: string;
  totalStock: number;
  updatedAt: string;
}

export interface Worker {
  id: string;
  companyId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
}

export interface Distribution {
  id: string;
  companyId: string;
  workerId: string;
  workerName: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit?: number;
  totalAmount?: number;
  distributedBy: string; // User Name
  distributedAt: string;
}

export interface DashboardStats {
  topProducts: { name: string; value: number }[];
  workerDistributions: { name: string; count: number }[];
  outOfStockCount: number;
  zeroSalesCount: number;
  recentTrends: { date: string; quantity: number }[];
}
