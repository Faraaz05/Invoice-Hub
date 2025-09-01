import type { 
  Invoice, 
  Vendor, 
  LineItem, 
  Approval, 
  Payment, 
  Settings,
  DashboardStats,
  SpendByDepartment,
  TopVendor
} from '@/types';

export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Tech Solutions Inc',
    gstNo: '27AABCT1234C1Z5',
    email: 'billing@techsolutions.com',
    phone: '+91-9876543210',
    address: 'Bangalore, Karnataka',
    defaultDepartment: 'IT'
  },
  {
    id: '2',
    name: 'Office Supplies Co',
    gstNo: '19AABCO5678D1Z3',
    email: 'orders@officesupplies.com',
    phone: '+91-8765432109',
    address: 'Mumbai, Maharashtra',
    defaultDepartment: 'Operations'
  },
  {
    id: '3',
    name: 'Consulting Partners',
    gstNo: '29AABCP9012E1Z1',
    email: 'billing@consulting.com',
    phone: '+91-7654321098',
    address: 'Delhi, India',
    defaultDepartment: 'Finance'
  }
];

export const mockLineItems: LineItem[] = [
  {
    id: '1',
    invoiceId: '1',
    description: 'Software License - Annual',
    qty: 5,
    unitPrice: 12000,
    amount: 60000,
    glCode: 'GL-001'
  },
  {
    id: '2',
    invoiceId: '1',
    description: 'Support Services',
    qty: 1,
    unitPrice: 15000,
    amount: 15000,
    glCode: 'GL-002'
  },
  {
    id: '3',
    invoiceId: '2',
    description: 'Office Chairs',
    qty: 10,
    unitPrice: 8500,
    amount: 85000,
    glCode: 'GL-003'
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    vendorId: '1',
    vendorName: 'Tech Solutions Inc',
    invoiceNumber: 'INV-2024-001',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    department: 'IT',
    subtotal: 75000,
    tax: 13500,
    total: 88500,
    currency: 'INR',
    status: 'pending_approval',
    tags: ['software', 'recurring'],
    createdBy: '1',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    vendorId: '2',
    vendorName: 'Office Supplies Co',
    invoiceNumber: 'OS-2024-045',
    date: '2024-01-10',
    dueDate: '2024-02-10',
    department: 'Operations',
    subtotal: 85000,
    tax: 15300,
    total: 100300,
    currency: 'INR',
    status: 'approved',
    tags: ['furniture', 'one-time'],
    createdBy: '1',
    createdAt: '2024-01-10T14:20:00Z'
  },
  {
    id: '3',
    vendorId: '3',
    vendorName: 'Consulting Partners',
    invoiceNumber: 'CP-2024-012',
    date: '2024-01-20',
    dueDate: '2024-01-25',
    department: 'Finance',
    subtotal: 150000,
    tax: 27000,
    total: 177000,
    currency: 'INR',
    status: 'overdue',
    tags: ['consulting', 'urgent'],
    createdBy: '2',
    createdAt: '2024-01-20T09:15:00Z'
  },
  {
    id: '4',
    vendorId: '1',
    vendorName: 'Tech Solutions Inc',
    invoiceNumber: 'INV-2024-002',
    date: '2024-01-25',
    dueDate: '2024-02-25',
    department: 'IT',
    subtotal: 45000,
    tax: 8100,
    total: 53100,
    currency: 'INR',
    status: 'paid',
    tags: ['maintenance'],
    createdBy: '1',
    createdAt: '2024-01-25T16:45:00Z'
  }
];

export const mockApprovals: Approval[] = [
  {
    id: '1',
    invoiceId: '1',
    step: 1,
    actorRole: 'manager',
    actorId: '2',
    action: 'submitted',
    comment: 'Submitted for manager approval',
    createdAt: '2024-01-15T10:35:00Z'
  },
  {
    id: '2',
    invoiceId: '2',
    step: 1,
    actorRole: 'manager',
    actorId: '2',
    action: 'approved',
    comment: 'Approved - standard office supplies',
    createdAt: '2024-01-10T15:20:00Z'
  }
];

export const mockPayments: Payment[] = [
  {
    id: '1',
    invoiceId: '4',
    date: '2024-01-30',
    mode: 'NEFT',
    transactionId: 'TXN123456789',
    amount: 53100
  }
];

export const mockSettings: Settings = {
  departments: ['IT', 'Operations', 'Finance', 'HR', 'Marketing'],
  approvalThresholds: {
    'IT': 100000,
    'Operations': 75000,
    'Finance': 50000,
    'HR': 25000,
    'Marketing': 50000
  },
  tags: ['software', 'hardware', 'consulting', 'recurring', 'one-time', 'urgent', 'maintenance', 'furniture']
};

export const mockDashboardStats: DashboardStats = {
  totalSpend: 318900,
  pendingApprovals: 1,
  overdueInvoices: 1,
  paidThisMonth: 53100
};

export const mockSpendByDepartment: SpendByDepartment[] = [
  { department: 'IT', amount: 141600 },
  { department: 'Operations', amount: 100300 },
  { department: 'Finance', amount: 177000 }
];

export const mockTopVendors: TopVendor[] = [
  { vendorName: 'Consulting Partners', amount: 177000, invoiceCount: 1 },
  { vendorName: 'Tech Solutions Inc', amount: 141600, invoiceCount: 2 },
  { vendorName: 'Office Supplies Co', amount: 100300, invoiceCount: 1 }
];