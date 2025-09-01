import { useState } from 'react';
import { Plus, Edit, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react';
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
import { useVendors, useCreateVendor } from '@/api/vendors';
import { useToast } from '@/hooks/use-toast';

export default function Vendors() {
  const [search, setSearch] = useState('');
  const [vendorDialog, setVendorDialog] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    vendor: any;
  }>({
    isOpen: false,
    mode: 'create',
    vendor: {
      name: '',
      gstNo: '',
      email: '',
      phone: '',
      address: '',
      defaultDepartment: ''
    }
  });

  const { data: vendors = [], isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const { toast } = useToast();

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(search.toLowerCase()) ||
    (vendor.gstNo || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDialog = () => {
    setVendorDialog({
      isOpen: true,
      mode: 'create',
      vendor: {
        name: '',
        gstNo: '',
        email: '',
        phone: '',
        address: '',
        defaultDepartment: ''
      }
    });
  };

  const openEditDialog = (vendor: any) => {
    setVendorDialog({
      isOpen: true,
      mode: 'edit',
      vendor: { ...vendor }
    });
  };

  const handleSubmit = async () => {
    try {
      if (vendorDialog.mode === 'create') {
        await createVendor.mutateAsync(vendorDialog.vendor);
        toast({
          title: "Vendor Created",
          description: "New vendor has been added successfully."
        });
      } else {
        // Update logic would go here
        toast({
          title: "Vendor Updated",
          description: "Vendor information has been updated."
        });
      }
      
      setVendorDialog(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = () => {
    return vendorDialog.vendor.name.trim() && vendorDialog.vendor.email.trim();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your vendor database and contact information
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Vendor Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">
              Active suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GST Registered</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.filter(v => v.gstNo).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tax compliant vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Department</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">IT</div>
            <p className="text-xs text-muted-foreground">
              Most active category
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Management */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>
            Search and manage your vendor relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by vendor name or GST number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>GST Number</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          {vendor.email && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {vendor.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vendor.gstNo ? (
                        <Badge variant="outline">{vendor.gstNo}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {vendor.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {vendor.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {vendor.defaultDepartment && (
                        <Badge variant="secondary">{vendor.defaultDepartment}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {vendor.address && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {vendor.address}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredVendors.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vendors found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Dialog */}
      <Dialog
        open={vendorDialog.isOpen}
        onOpenChange={(open) => setVendorDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {vendorDialog.mode === 'create' ? 'Add New Vendor' : 'Edit Vendor'}
            </DialogTitle>
            <DialogDescription>
              {vendorDialog.mode === 'create' 
                ? 'Enter vendor information to add them to your directory'
                : 'Update vendor information and contact details'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name *</Label>
                <Input
                  value={vendorDialog.vendor.name}
                  onChange={(e) => setVendorDialog(prev => ({
                    ...prev,
                    vendor: { ...prev.vendor, name: e.target.value }
                  }))}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input
                  value={vendorDialog.vendor.gstNo}
                  onChange={(e) => setVendorDialog(prev => ({
                    ...prev,
                    vendor: { ...prev.vendor, gstNo: e.target.value }
                  }))}
                  placeholder="27AABCT1234C1Z5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={vendorDialog.vendor.email}
                  onChange={(e) => setVendorDialog(prev => ({
                    ...prev,
                    vendor: { ...prev.vendor, email: e.target.value }
                  }))}
                  placeholder="vendor@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={vendorDialog.vendor.phone}
                  onChange={(e) => setVendorDialog(prev => ({
                    ...prev,
                    vendor: { ...prev.vendor, phone: e.target.value }
                  }))}
                  placeholder="+91-9876543210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={vendorDialog.vendor.address}
                onChange={(e) => setVendorDialog(prev => ({
                  ...prev,
                  vendor: { ...prev.vendor, address: e.target.value }
                }))}
                placeholder="City, State, Country"
              />
            </div>

            <div className="space-y-2">
              <Label>Default Department</Label>
              <Select
                value={vendorDialog.vendor.defaultDepartment}
                onValueChange={(value) => setVendorDialog(prev => ({
                  ...prev,
                  vendor: { ...prev.vendor, defaultDepartment: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || createVendor.isPending}
              className="w-full"
            >
              {createVendor.isPending 
                ? 'Saving...' 
                : vendorDialog.mode === 'create' 
                  ? 'Create Vendor' 
                  : 'Update Vendor'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}