export type VisitState = 'PENDING' | 'APPROVED' | 'DENIED' | 'CHECKED_IN' | 'CHECKED_OUT';

export interface Visitor {
  name: string;
  contact: string;
}

export interface Host {
  id: string;
  name: string;
  department?: string;
}

export interface Visit {
  id: string;
  visitor: Visitor;
  purpose: string;
  hostEmployee: string;
  state: VisitState;
  createdAt: Date;
  updatedAt?: Date;
}

export const SEED_HOSTS: Host[] = [
  { id: 'EMP-77', name: 'Manish R', department: 'ION Team' },
  { id: 'EMP-31', name: 'Sricharan', department: 'Engineering' },
  { id: 'EMP-52', name: 'Dheeraj S', department: 'Product Operations' },
];

export const VISIT_PURPOSES: string[] = [
  'Meeting',
  'Interview',
  'Delivery',
  'Maintenance',
  'Vendor meeting'
];

export const ALLOWED_TRANSITIONS: Record<VisitState, VisitState[]> = {
  PENDING: ['APPROVED', 'DENIED'],
  APPROVED: ['CHECKED_IN'],
  CHECKED_IN: ['CHECKED_OUT'],
  DENIED: [],
  CHECKED_OUT: []
};

export type FilterTab = 'ALL' | 'PENDING' | 'ON_PREMISES';
