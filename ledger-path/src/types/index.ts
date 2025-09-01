export type UserRole = 'clerk' | 'manager' | 'controller' | 'admin';

export type InvoiceStatus = 
  | 'draft' 
  | 'verification' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'paid' 
  | 'overdue';

export type PaymentMode = 'NEFT' | 'RTGS' | 'UPI' | 'Card' | 'Cash';

export type ApprovalAction = 'approved' | 'rejected' | 'commented' | 'submitted';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface Vendor {
  id: string;
  name: string;
  gstNo?: string;
  email?: string;
  phone?: string;
  address?: string;
  defaultDepartment?: string;
}

export interface LineItem {
  id?: number;
  invoice_id?: number;
  description: string;
  sac_code?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id?: number;
  filename?: string;
  processed_date?: string;
  status: InvoiceStatus;
  
  // Vendor/Seller information
  seller_name?: string;
  seller_address?: string;
  seller_email?: string;
  seller_gstin?: string;
  
  // Buyer information
  buyer_name?: string;
  buyer_address?: string;
  buyer_gstin?: string;
  
  // Invoice details
  invoice_number?: string;
  invoice_date?: string;
  invoice_month?: string;
  reference_number?: string;
  
  // Financial details
  total_amount: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  
  // Additional information
  pan_number?: string;
  amount_in_words?: string;
  
  // Workflow fields
  department?: string;
  assigned_to?: number;
  approved_by?: number;
  comments?: string;
  
  // OCR and Processing data
  summary?: string;
  
  // Line items
  items: LineItem[];
}

export interface Approval {
  id: string;
  invoiceId: string;
  step: number;
  actorRole: 'manager' | 'controller';
  actorId?: string;
  action: ApprovalAction;
  comment?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  date: string;
  mode: PaymentMode;
  transactionId: string;
  amount: number;
}

export interface OCRResult {
  fields: {
    vendorName?: string;
    invoiceNumber?: string;
    date?: string;
    total?: number;
    [key: string]: any;
  };
  lineItems: Omit<LineItem, 'id' | 'invoiceId'>[];
  keywords: string[];
  confidence: Record<string, number>;
}

export interface DashboardStats {
  totalSpend: number;
  pendingApprovals: number;
  overdueInvoices: number;
  paidThisMonth: number;
}

export interface SpendByDepartment {
  department: string;
  amount: number;
}

export interface TopVendor {
  vendorName: string;
  amount: number;
  invoiceCount: number;
}

export interface InvoiceFilters {
  search?: string;
  vendorId?: string;
  department?: string;
  status?: InvoiceStatus[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
}

export interface Settings {
  departments: string[];
  approvalThresholds: Record<string, number>;
  tags: string[];
}