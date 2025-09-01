import { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useInvoices, useInvoiceActions } from '@/api/invoices';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const mockPendingInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    vendorName: 'Tech Solutions Inc',
    department: 'IT',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    total: 88500,
    description: 'Software License - Annual',
    submittedBy: 'John Clerk',
    submittedAt: '2024-01-15T10:30:00Z',
    priority: 'normal'
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-005',
    vendorName: 'Marketing Agency',
    department: 'Marketing',
    date: '2024-01-18',
    dueDate: '2024-02-18',
    total: 125000,
    description: 'Q1 Campaign Development',
    submittedBy: 'Sarah Marketing',
    submittedAt: '2024-01-18T14:20:00Z',
    priority: 'high'
  },
  {
    id: '6',
    invoiceNumber: 'INV-2024-006',
    vendorName: 'Office Furniture Co',
    department: 'Operations',
    date: '2024-01-20',
    dueDate: '2024-02-20',
    total: 45000,
    description: 'Ergonomic Workstations',
    submittedBy: 'Mike Operations',
    submittedAt: '2024-01-20T09:15:00Z',
    priority: 'normal'
  }
];

export default function Approvals() {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [bulkComment, setBulkComment] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | 'comment' | null;
    invoiceId: string | null;
    comment: string;
  }>({
    isOpen: false,
    action: null,
    invoiceId: null,
    comment: ''
  });

  const { toast } = useToast();
  const { approve, reject } = useInvoiceActions();

  const filteredInvoices = mockPendingInvoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'high-value') return invoice.total >= 100000;
    if (filter === 'urgent') return invoice.priority === 'high';
    return true;
  });

  const handleSingleAction = async (action: 'approve' | 'reject', invoiceId: string, comment?: string) => {
    try {
      if (action === 'approve') {
        await approve.mutateAsync({ id: invoiceId, comment });
        toast({
          title: "Invoice Approved",
          description: "The invoice has been approved successfully."
        });
      } else {
        await reject.mutateAsync({ id: invoiceId, comment: comment || 'Rejected' });
        toast({
          title: "Invoice Rejected",
          description: "The invoice has been rejected."
        });
      }
      
      setActionDialog({ isOpen: false, action: null, invoiceId: null, comment: '' });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBulkApprove = () => {
    selectedInvoices.forEach(id => {
      handleSingleAction('approve', id, bulkComment);
    });
    setSelectedInvoices([]);
    setBulkComment('');
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve pending invoice submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {mockPendingInvoices.length} Pending
          </Badge>
        </div>
      </div>

      {/* Filter and Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Filter invoices and perform bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invoices</SelectItem>
                  <SelectItem value="high-value">High Value (≥₹1L)</SelectItem>
                  <SelectItem value="urgent">Urgent Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedInvoices.length > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedInvoices.length} selected
                </span>
                <Textarea
                  placeholder="Add comment for bulk approval..."
                  value={bulkComment}
                  onChange={(e) => setBulkComment(e.target.value)}
                  className="max-w-xs"
                  rows={1}
                />
                <Button onClick={handleBulkApprove} size="sm">
                  Bulk Approve
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Invoices awaiting your review and approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(filteredInvoices.map(inv => inv.id));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.vendorName}</TableCell>
                    <TableCell>{invoice.department}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(invoice.priority)}>
                        {invoice.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.submittedBy}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {/* View invoice details */}}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Invoice</DialogTitle>
                              <DialogDescription>
                                Approve {invoice.invoiceNumber} for {formatCurrency(invoice.total)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Comment (Optional)</label>
                                <Textarea
                                  placeholder="Add approval comment..."
                                  value={actionDialog.comment}
                                  onChange={(e) => setActionDialog(prev => ({ ...prev, comment: e.target.value }))}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => handleSingleAction('approve', invoice.id, actionDialog.comment)}
                              >
                                Approve Invoice
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Invoice</DialogTitle>
                              <DialogDescription>
                                Reject {invoice.invoiceNumber} and provide a reason
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Rejection Reason *</label>
                                <Textarea
                                  placeholder="Please provide a reason for rejection..."
                                  value={actionDialog.comment}
                                  onChange={(e) => setActionDialog(prev => ({ ...prev, comment: e.target.value }))}
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="destructive"
                                onClick={() => handleSingleAction('reject', invoice.id, actionDialog.comment)}
                                disabled={!actionDialog.comment.trim()}
                              >
                                Reject Invoice
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button variant="ghost" size="icon" className="text-blue-600">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invoices pending approval.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}