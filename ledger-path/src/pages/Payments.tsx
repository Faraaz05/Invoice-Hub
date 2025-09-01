import { useState } from 'react';
import { CreditCard, Calendar, Hash, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const mockApprovedInvoices = [
  {
    id: '2',
    invoiceNumber: 'OS-2024-045',
    vendorName: 'Office Supplies Co',
    department: 'Operations',
    date: '2024-01-10',
    dueDate: '2024-02-10',
    total: 100300,
    status: 'approved',
    approvedBy: 'Sarah Manager',
    approvedAt: '2024-01-10T15:20:00Z'
  },
  {
    id: '7',
    invoiceNumber: 'INV-2024-007',
    vendorName: 'Cloud Services Inc',
    department: 'IT',
    date: '2024-01-22',
    dueDate: '2024-02-22',
    total: 85000,
    status: 'approved',
    approvedBy: 'David Controller',
    approvedAt: '2024-01-22T11:30:00Z'
  },
  {
    id: '8',
    invoiceNumber: 'HR-2024-003',
    vendorName: 'Training Solutions',
    department: 'HR',
    date: '2024-01-25',
    dueDate: '2024-02-25',
    total: 65000,
    status: 'approved',
    approvedBy: 'Sarah Manager',
    approvedAt: '2024-01-25T09:45:00Z'
  }
];

export default function Payments() {
  const [filter, setFilter] = useState('all');
  const [paymentDialog, setPaymentDialog] = useState<{
    isOpen: boolean;
    invoice: any;
    formData: {
      date: string;
      mode: string;
      transactionId: string;
      amount: number;
    };
  }>({
    isOpen: false,
    invoice: null,
    formData: {
      date: new Date().toISOString().split('T')[0],
      mode: '',
      transactionId: '',
      amount: 0
    }
  });

  const { toast } = useToast();

  const filteredInvoices = mockApprovedInvoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'high-value') return invoice.total >= 80000;
    if (filter === 'due-soon') {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return true;
  });

  const openPaymentDialog = (invoice: any) => {
    setPaymentDialog({
      isOpen: true,
      invoice,
      formData: {
        date: new Date().toISOString().split('T')[0],
        mode: '',
        transactionId: '',
        amount: invoice.total
      }
    });
  };

  const handlePayment = async () => {
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(paymentDialog.formData.amount)} has been recorded successfully.`
      });
      
      setPaymentDialog({
        isOpen: false,
        invoice: null,
        formData: {
          date: new Date().toISOString().split('T')[0],
          mode: '',
          transactionId: '',
          amount: 0
        }
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = () => {
    const { mode, transactionId, amount } = paymentDialog.formData;
    return mode && transactionId && amount > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Process payments for approved invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {mockApprovedInvoices.length} Ready for Payment
          </Badge>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockApprovedInvoices.reduce((sum, inv) => sum + inv.total, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockApprovedInvoices.length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(185300)} value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(53100)}</div>
            <p className="text-xs text-muted-foreground">
              1 payment processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Queue</CardTitle>
          <CardDescription>
            Filter and process approved invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approved</SelectItem>
                <SelectItem value="high-value">High Value (≥₹80K)</SelectItem>
                <SelectItem value="due-soon">Due This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Approved Invoices for Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Ready for Payment</CardTitle>
          <CardDescription>
            Approved invoices awaiting payment processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const dueDate = new Date(invoice.dueDate);
                  const today = new Date();
                  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isDueSoon = diffDays <= 7;

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.vendorName}</TableCell>
                      <TableCell>{invoice.department}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <div className={isDueSoon ? 'text-orange-600 font-medium' : ''}>
                          {formatDate(invoice.dueDate)}
                          {isDueSoon && (
                            <div className="text-xs text-orange-600">
                              Due in {diffDays} days
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.approvedBy}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          APPROVED
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog
                          open={paymentDialog.isOpen && paymentDialog.invoice?.id === invoice.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setPaymentDialog(prev => ({ ...prev, isOpen: false }));
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => openPaymentDialog(invoice)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Mark as Paid
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Record Payment</DialogTitle>
                              <DialogDescription>
                                Record payment details for {invoice.invoiceNumber}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Payment Date</Label>
                                <Input
                                  type="date"
                                  value={paymentDialog.formData.date}
                                  onChange={(e) => setPaymentDialog(prev => ({
                                    ...prev,
                                    formData: { ...prev.formData, date: e.target.value }
                                  }))}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Payment Mode</Label>
                                <Select
                                  value={paymentDialog.formData.mode}
                                  onValueChange={(value) => setPaymentDialog(prev => ({
                                    ...prev,
                                    formData: { ...prev.formData, mode: value }
                                  }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="NEFT">NEFT</SelectItem>
                                    <SelectItem value="RTGS">RTGS</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Card">Card</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Transaction ID</Label>
                                <Input
                                  placeholder="Enter transaction reference"
                                  value={paymentDialog.formData.transactionId}
                                  onChange={(e) => setPaymentDialog(prev => ({
                                    ...prev,
                                    formData: { ...prev.formData, transactionId: e.target.value }
                                  }))}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input
                                  type="number"
                                  value={paymentDialog.formData.amount}
                                  onChange={(e) => setPaymentDialog(prev => ({
                                    ...prev,
                                    formData: { ...prev.formData, amount: parseFloat(e.target.value) || 0 }
                                  }))}
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                onClick={handlePayment}
                                disabled={!isFormValid()}
                                className="w-full"
                              >
                                Record Payment
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invoices ready for payment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}