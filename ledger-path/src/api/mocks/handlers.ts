import { http, HttpResponse } from 'msw';
import { 
  mockInvoices, 
  mockVendors, 
  mockLineItems, 
  mockApprovals, 
  mockPayments, 
  mockSettings,
  mockDashboardStats,
  mockSpendByDepartment,
  mockTopVendors
} from './data';
import { demoUsers } from '@/store/auth';
import type { Invoice, OCRResult, Payment, Vendor, Settings } from '@/types';

// Helper to simulate delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    await delay(500);
    const body = await request.json() as { email: string; password: string };
    
    if (body.password !== 'pass') {
      return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const user = demoUsers.find(u => u.email === body.email);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return HttpResponse.json({ user, token: 'mock-token' });
  }),

  http.get('/api/auth/me', async () => {
    await delay(200);
    return HttpResponse.json({ user: demoUsers[0] }); // Default to first user
  }),

  // Invoice endpoints
  http.get('/api/invoices', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');
    const department = url.searchParams.get('department');
    
    let filtered = [...mockInvoices];
    
    if (search) {
      filtered = filtered.filter(invoice => 
        invoice.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filtered = filtered.filter(invoice => invoice.status === status);
    }
    
    if (department) {
      filtered = filtered.filter(invoice => invoice.department === department);
    }
    
    return HttpResponse.json({
      data: filtered,
      total: filtered.length,
      page: 1,
      limit: 50
    });
  }),

  http.get('/api/invoices/:id', async ({ params }) => {
    await delay(200);
    const invoice = mockInvoices.find(inv => inv.id === params.id);
    if (!invoice) {
      return HttpResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    const lineItems = mockLineItems.filter(item => item.invoiceId === invoice.id);
    const approvals = mockApprovals.filter(approval => approval.invoiceId === invoice.id);
    
    return HttpResponse.json({
      ...invoice,
      lineItems,
      approvals
    });
  }),

  http.post('/api/invoices', async ({ request }) => {
    await delay(800);
    const body = await request.json() as Partial<Invoice>;
    
    const newInvoice: Invoice = {
      id: String(mockInvoices.length + 1),
      vendorId: body.vendorId || '1',
      vendorName: body.vendorName || 'New Vendor',
      invoiceNumber: body.invoiceNumber || `INV-${Date.now()}`,
      date: body.date || new Date().toISOString().split('T')[0],
      dueDate: body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      department: body.department || 'Operations',
      subtotal: body.subtotal || 0,
      tax: body.tax || 0,
      total: body.total || 0,
      currency: 'INR',
      status: 'draft',
      tags: body.tags || [],
      createdBy: '1',
      createdAt: new Date().toISOString()
    };
    
    mockInvoices.push(newInvoice);
    return HttpResponse.json(newInvoice, { status: 201 });
  }),

  http.put('/api/invoices/:id', async ({ params, request }) => {
    await delay(500);
    const body = await request.json() as Partial<Invoice>;
    const index = mockInvoices.findIndex(inv => inv.id === params.id);
    
    if (index === -1) {
      return HttpResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    mockInvoices[index] = { ...mockInvoices[index], ...body };
    return HttpResponse.json(mockInvoices[index]);
  }),

  // OCR endpoint
  http.post('/api/ocr', async () => {
    await delay(2000); // Simulate processing time
    
    const mockOCRResult: OCRResult = {
      fields: {
        vendorName: 'Extracted Vendor Name',
        invoiceNumber: 'EXT-2024-001',
        date: new Date().toISOString().split('T')[0],
        total: 75000
      },
      lineItems: [
        {
          description: 'Extracted Service Item',
          qty: 1,
          unitPrice: 75000,
          amount: 75000
        }
      ],
      keywords: ['service', 'annual', 'license'],
      confidence: {
        vendorName: 0.95,
        invoiceNumber: 0.98,
        date: 0.92,
        total: 0.89
      }
    };
    
    return HttpResponse.json(mockOCRResult);
  }),

  // Workflow endpoints
  http.post('/api/invoices/:id/submit', async ({ params }) => {
    await delay(300);
    const invoice = mockInvoices.find(inv => inv.id === params.id);
    if (invoice) {
      invoice.status = 'pending_approval';
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/invoices/:id/approve', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as { comment?: string };
    const invoice = mockInvoices.find(inv => inv.id === params.id);
    if (invoice) {
      invoice.status = 'approved';
      // Add approval record
      mockApprovals.push({
        id: String(mockApprovals.length + 1),
        invoiceId: invoice.id,
        step: 1,
        actorRole: 'manager',
        action: 'approved',
        comment: body.comment,
        createdAt: new Date().toISOString()
      });
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/invoices/:id/reject', async ({ params, request }) => {
    await delay(400);
    const body = await request.json() as { comment: string };
    const invoice = mockInvoices.find(inv => inv.id === params.id);
    if (invoice) {
      invoice.status = 'rejected';
      mockApprovals.push({
        id: String(mockApprovals.length + 1),
        invoiceId: invoice.id,
        step: 1,
        actorRole: 'manager',
        action: 'rejected',
        comment: body.comment,
        createdAt: new Date().toISOString()
      });
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/invoices/:id/pay', async ({ params, request }) => {
    await delay(500);
    const body = await request.json() as Omit<Payment, 'id'>;
    const invoice = mockInvoices.find(inv => inv.id === params.id);
    if (invoice) {
      invoice.status = 'paid';
      mockPayments.push({
        id: String(mockPayments.length + 1),
        ...body
      });
    }
    return HttpResponse.json({ success: true });
  }),

  // Vendor endpoints
  http.get('/api/vendors', async () => {
    await delay(200);
    return HttpResponse.json(mockVendors);
  }),

  http.post('/api/vendors', async ({ request }) => {
    await delay(300);
    const body = await request.json() as Omit<Vendor, 'id'>;
    const newVendor = {
      id: String(mockVendors.length + 1),
      ...body
    };
    mockVendors.push(newVendor);
    return HttpResponse.json(newVendor, { status: 201 });
  }),

  // Dashboard endpoints
  http.get('/api/dashboard/stats', async () => {
    await delay(300);
    return HttpResponse.json(mockDashboardStats);
  }),

  http.get('/api/dashboard/spend-by-department', async () => {
    await delay(200);
    return HttpResponse.json(mockSpendByDepartment);
  }),

  http.get('/api/dashboard/top-vendors', async () => {
    await delay(200);
    return HttpResponse.json(mockTopVendors);
  }),

  // Settings endpoints
  http.get('/api/settings', async () => {
    await delay(200);
    return HttpResponse.json(mockSettings);
  }),

  http.put('/api/settings', async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<Settings>;
    Object.assign(mockSettings, body);
    return HttpResponse.json(mockSettings);
  })
];