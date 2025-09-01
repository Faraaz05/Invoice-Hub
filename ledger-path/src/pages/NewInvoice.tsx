import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUploadInvoice } from '@/api/invoices';
import { formatCurrency } from '@/lib/utils';
import { LineItem, Invoice } from '@/types';

export default function NewInvoice() {
  const [files, setFiles] = useState<File[]>([]);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  const [invoiceData, setInvoiceData] = useState<Partial<Invoice>>({
    seller_name: '',
    invoice_number: '',
    invoice_date: '',
    department: '',
    taxable_amount: 0,
    cgst: 0,
    sgst: 0,
    total_amount: 0,
    items: []
  });

  const { toast } = useToast();
  const uploadMutation = useUploadInvoice();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/zip': ['.zip']
    },
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
      processOCR(acceptedFiles);
    }
  });

  const processOCR = async (files: File[]) => {
    setOcrProgress(10);
    
    try {
      // Simulate OCR processing with progress
      const interval = setInterval(() => {
        setOcrProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadMutation.mutateAsync({ 
        file: files[0],
        department: invoiceData.department || 'IT'
      });
      
      clearInterval(interval);
      setOcrProgress(100);
      
      // Populate extracted data from OCR results
      if (result.ocr_result && result.ocr_result.extracted_data) {
        setExtractedData(result.ocr_result);
        const extracted = result.ocr_result.extracted_data;
        
        setInvoiceData(prev => ({
          ...prev,
          seller_name: extracted.seller_name || '',
          invoice_number: extracted.invoice_number || '',
          invoice_date: extracted.invoice_date || '',
          total_amount: extracted.total_amount || 0,
          taxable_amount: extracted.taxable_amount || 0,
          cgst: extracted.cgst || 0,
          sgst: extracted.sgst || 0
        }));

        if (extracted.items && extracted.items.length > 0) {
          setLineItems(extracted.items.map((item: any) => ({
            description: item.description || '',
            sac_code: item.sac_code || '',
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            amount: item.amount || 0
          })));
        }
      }

      toast({
        title: "OCR Processing Complete",
        description: result.ocr_result?.summary || "Invoice data has been extracted successfully."
      });
      
    } catch (error) {
      toast({
        title: "OCR Processing Failed",
        description: "Please try again or enter data manually.",
        variant: "destructive"
      });
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    
    setLineItems(updated);
    
    // Recalculate totals
    const taxableAmount = updated.reduce((sum, item) => sum + item.amount, 0);
    const cgst = taxableAmount * 0.09; // 9% CGST
    const sgst = taxableAmount * 0.09; // 9% SGST
    const totalAmount = taxableAmount + cgst + sgst;
    
    setInvoiceData(prev => ({ 
      ...prev, 
      taxable_amount: taxableAmount, 
      cgst, 
      sgst, 
      total_amount: totalAmount 
    }));
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="h-6 w-6" />;
    if (file.type.includes('image')) return <Image className="h-6 w-6" />;
    if (file.type.includes('zip')) return <Package className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
        <p className="text-muted-foreground">
          Upload invoice documents and extract data automatically
        </p>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>
            Drag and drop PDF, images, or ZIP files to extract invoice data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg">Drag & drop invoice files here</p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, PNG, JPG, ZIP files
                </p>
                <Button variant="outline" className="mt-4">
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium">Uploaded Files</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getFileIcon(file)}
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ))}
              
              {ocrProgress > 0 && ocrProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing OCR...</span>
                    <span>{ocrProgress}%</span>
                  </div>
                  <Progress value={ocrProgress} className="h-2" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data */}
      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            <CardDescription>
              Review and edit the extracted information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={invoiceData.seller_name || ''}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, seller_name: e.target.value }))}
                  />
                  {extractedData?.confidence_score && (
                    <Badge className={getConfidenceColor(extractedData.confidence_score)}>
                      {Math.round(extractedData.confidence_score * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={invoiceData.invoice_number || ''}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  />
                  {extractedData?.confidence_score && (
                    <Badge className={getConfidenceColor(extractedData.confidence_score)}>
                      {Math.round(extractedData.confidence_score * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={invoiceData.invoice_date || ''}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input
                  value={invoiceData.reference_number || ''}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, reference_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select 
                  value={invoiceData.department} 
                  onValueChange={(value) => setInvoiceData(prev => ({ ...prev, department: value }))}
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
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>
            Add and manage invoice line items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-32">Rate</TableHead>
                  <TableHead className="w-32">Amount</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(item.amount)}</div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        ×
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Button variant="outline" onClick={addLineItem}>
              Add Line Item
            </Button>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between">
                <span>Taxable Amount:</span>
                <span>{formatCurrency(invoiceData.taxable_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (9%):</span>
                <span>{formatCurrency(invoiceData.cgst || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (9%):</span>
                <span>{formatCurrency(invoiceData.sgst || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(invoiceData.total_amount || 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline">Save Draft</Button>
        <Button>Submit for Verification</Button>
      </div>
    </div>
  );
}