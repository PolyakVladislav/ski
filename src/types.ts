export interface Person {
  id: string;
  name: string;
  phone: string;
}

export interface PackingItem {
  id: string;
  category: string;
  name: string;
  checked: boolean;
  assignedTo?: string;
  checkedBy?: string;
  quantity?: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: 'EUR' | 'ILS' | 'USD';
  paidBy: string | string[];
  splitBetween: string[];
  date: string;
  fixedType?: string;
  rateEurIls?: number;
  rateUsdIls?: number;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  people: Person[];
  packingItems: PackingItem[];
  expenses: Expense[];
}

export type TabId = 'trip' | 'packing' | 'expenses' | 'resort';

export interface UserSession {
  phone: string;
  name: string;
}
