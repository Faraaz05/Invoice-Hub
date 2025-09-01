import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  PlusCircle,
  CheckCircle,
  CreditCard,
  Building2,
  Settings,
  Receipt,
  Users,
  Shield
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Admin Dashboard',
    url: '/admin',
    icon: Shield,
    roles: ['admin']
  },
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: BarChart3,
    roles: ['controller']
  },
  {
    title: 'New Invoice',
    url: '/invoices/new',
    icon: PlusCircle,
    roles: ['clerk']
  },
  {
    title: 'All Invoices',
    url: '/invoices',
    icon: FileText,
    roles: ['clerk', 'controller']
  },
  {
    title: 'Approvals',
    url: '/approvals',
    icon: CheckCircle,
    roles: ['manager', 'controller']
  },
  {
    title: 'Payments',
    url: '/payments',
    icon: CreditCard,
    roles: ['controller']
  },
  {
    title: 'Vendors',
    url: '/vendors',
    icon: Building2,
    roles: ['controller']
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: Receipt,
    roles: ['controller']
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    roles: ['controller']
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, hasRole } = useAuthStore();
  
  const filteredItems = navigationItems.filter(item => 
    item.roles.some(role => hasRole(role as any))
  );

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarContent>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Receipt className="h-4 w-4" />
            </div>
            {state !== 'collapsed' && (
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-sidebar-foreground">
                  InvoiceHub
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  Enterprise Edition
                </span>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {state !== 'collapsed' && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {state !== 'collapsed' && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/60">
              Logged in as <span className="font-medium">{user?.name}</span>
            </div>
            <div className="text-xs text-sidebar-foreground/40 capitalize">
              {user?.role} • {user?.department}
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}