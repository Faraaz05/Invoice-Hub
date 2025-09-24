const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.emailEnabled = process.env.EMAIL_ENABLED === 'true';
    
    // Initialize email transporter for production
    if (this.isProduction && this.emailEnabled) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    
    console.log(`📧 Email Service initialized - Mode: ${this.isProduction ? 'Production' : 'Development'}`);
    if (!this.emailEnabled) {
      console.log('📧 Email notifications will be logged to console (EMAIL_ENABLED=false)');
    }
  }

  /**
   * Send email notification (or log to console in development)
   * @param {Object} emailOptions - Email configuration
   * @param {string} emailOptions.to - Recipient email
   * @param {string} emailOptions.subject - Email subject
   * @param {string} emailOptions.text - Plain text content
   * @param {string} emailOptions.html - HTML content
   * @param {Object} emailOptions.templateData - Data for email template
   */
  async sendEmail({ to, subject, text, html, templateData = {} }) {
    try {
      if (this.isProduction && this.emailEnabled && this.transporter) {
        // Send real email in production
        const mailOptions = {
          from: `"InvoiceHub System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to,
          subject,
          text,
          html: html || this.generateHTMLTemplate(subject, text, templateData)
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
        
      } else {
        // Log to console in development
        console.log('\n' + '='.repeat(60));
        console.log('📧 EMAIL NOTIFICATION (Development Mode)');
        console.log('='.repeat(60));
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${text}`);
        if (Object.keys(templateData).length > 0) {
          console.log('Template Data:', JSON.stringify(templateData, null, 2));
        }
        console.log('='.repeat(60) + '\n');
        
        return { success: true, messageId: 'dev-mode-' + Date.now() };
      }
      
    } catch (error) {
      console.error('📧 Email sending failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HTML template for emails
   */
  generateHTMLTemplate(subject, content, data = {}) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .invoice-details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .button { display: inline-block; background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧾 InvoiceHub Notification</h1>
            </div>
            <div class="content">
              <p>${content}</p>
              ${data.invoiceDetails ? this.generateInvoiceDetailsHTML(data.invoiceDetails) : ''}
              ${data.actionUrl ? `<p><a href="${data.actionUrl}" class="button">Take Action</a></p>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from InvoiceHub System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate invoice details HTML for email template
   */
  generateInvoiceDetailsHTML(invoice) {
    return `
      <div class="invoice-details">
        <h3>Invoice Details</h3>
        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Vendor:</strong> ${invoice.billedBy?.name || 'N/A'}</p>
        <p><strong>Amount:</strong> ₹${invoice.totals?.grandTotal?.toLocaleString() || '0'}</p>
        <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
        <p><strong>Uploaded By:</strong> ${invoice.uploadedBy?.name || 'Unknown'}</p>
      </div>
    `;
  }

  /**
   * Notify managers about new invoice uploads
   */
  async notifyNewInvoice(invoice, managers = []) {
    const subject = `New Invoice Pending Approval - ${invoice.invoiceNumber}`;
    const content = `
      A new invoice has been uploaded and requires your approval.
      
      Invoice: ${invoice.invoiceNumber}
      Vendor: ${invoice.billedBy?.name || 'Unknown'}
      Amount: ₹${invoice.totals?.grandTotal?.toLocaleString() || '0'}
      Uploaded by: ${invoice.uploadedBy?.name || 'Unknown'}
      
      Please review and approve this invoice in the InvoiceHub system.
    `;

    const results = [];
    
    // Send to all managers
    for (const manager of managers) {
      const result = await this.sendEmail({
        to: manager.email,
        subject,
        text: content,
        templateData: {
          invoiceDetails: invoice,
          actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice._id}`
        }
      });
      results.push({ manager: manager.email, ...result });
    }
    
    return results;
  }

  /**
   * Notify controllers about high-value invoice escalations
   */
  async notifyEscalation(invoice, controllers = [], approver = null) {
    const isHighValue = invoice.totals?.grandTotal >= (process.env.HIGH_VALUE_THRESHOLD || 500000);
    
    const subject = `HIGH VALUE: Invoice Escalation Required - ${invoice.invoiceNumber}`;
    const content = `
      A high-value invoice has been approved by a manager and requires controller approval.
      
      Invoice: ${invoice.invoiceNumber}
      Vendor: ${invoice.billedBy?.name || 'Unknown'}
      Amount: ₹${invoice.totals?.grandTotal?.toLocaleString() || '0'}
      Approved by: ${approver?.name || 'Unknown Manager'}
      
      This invoice exceeds the high-value threshold and requires your final approval.
      
      Please review and take action in the InvoiceHub system.
    `;

    const results = [];
    
    // Send to all controllers
    for (const controller of controllers) {
      const result = await this.sendEmail({
        to: controller.email,
        subject,
        text: content,
        templateData: {
          invoiceDetails: invoice,
          actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice._id}`,
          escalationReason: isHighValue ? 'High Value Amount' : 'Management Escalation'
        }
      });
      results.push({ controller: controller.email, ...result });
    }
    
    return results;
  }

  /**
   * Notify when invoice is paid
   */
  async notifyPaymentComplete(invoice, users = []) {
    const subject = `Payment Completed - ${invoice.invoiceNumber}`;
    const content = `
      Invoice payment has been marked as completed.
      
      Invoice: ${invoice.invoiceNumber}
      Vendor: ${invoice.billedBy?.name || 'Unknown'}
      Amount: ₹${invoice.totals?.grandTotal?.toLocaleString() || '0'}
      
      The invoice processing workflow is now complete.
    `;

    const results = [];
    
    for (const user of users) {
      const result = await this.sendEmail({
        to: user.email,
        subject,
        text: content,
        templateData: {
          invoiceDetails: invoice
        }
      });
      results.push({ user: user.email, ...result });
    }
    
    return results;
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = {
  sendEmail: (options) => emailService.sendEmail(options),
  notifyNewInvoice: (invoice, managers) => emailService.notifyNewInvoice(invoice, managers),
  notifyEscalation: (invoice, controllers, approver) => emailService.notifyEscalation(invoice, controllers, approver),
  notifyPaymentComplete: (invoice, users) => emailService.notifyPaymentComplete(invoice, users)
};