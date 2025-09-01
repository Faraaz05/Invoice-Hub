# InvoiceHub - Enterprise Invoice Management System

A complete React frontend for enterprise invoice processing, approval workflows, and financial analytics.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:8080` and login with demo credentials.

## 🔐 Demo Accounts

| Role | Email | Password | Default Route |
|------|-------|----------|---------------|
| **Clerk** | `clerk@demo` | `pass` | New Invoice |
| **Manager** | `manager@demo` | `pass` | Approvals |
| **Controller** | `controller@demo` | `pass` | Dashboard |

## ✅ Implemented Features

### Core Infrastructure
- ✅ Professional design system with enterprise theming
- ✅ Role-based authentication & routing 
- ✅ MSW mock API with realistic data
- ✅ TypeScript interfaces for all data models
- ✅ React Query for server state management
- ✅ Zustand for app state

### Pages & Components
- ✅ **Login Page** - Clean authentication with demo accounts
- ✅ **Dashboard** - Analytics with charts (Controller only)
- ✅ **Layout** - Professional sidebar navigation
- ✅ **Protected Routes** - Role-based access control

### Dashboard Analytics
- ✅ Real-time stats cards (Total Spend, Pending, Overdue, Paid)
- ✅ Department spending breakdown (Bar chart)
- ✅ Top vendors analysis (Pie chart)

## 🔄 Coming Next

The foundation is complete! Ready to implement:
- Invoice management (list, create, edit)
- OCR file upload with drag-and-drop
- Approval workflow with status transitions
- Payment processing interface
- Vendor management CRUD
- Reports with CSV export
- Settings management

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query + Zustand
- **Routing**: React Router v6
- **Forms**: react-hook-form + zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Mock API**: MSW (Mock Service Worker)

## 🎨 Design System

Professional enterprise theme with:
- Primary: `hsl(216 87% 48%)` - Professional blue
- Semantic color tokens for status indicators
- Elegant shadows and gradients
- Responsive design patterns

Start with any role to explore the interface!