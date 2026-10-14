import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

/* Map path → page title */
function titleFromPath(path) {
  if (path.startsWith('/admin/dashboard'))         return 'Admin Dashboard';
  if (path === '/admin/clients')                   return 'Clients';
  if (path.startsWith('/admin/clients/'))          return 'Client Details';
  if (path === '/admin/accounts')                  return 'Accounts';
  if (path === '/admin/transactions')              return 'Transactions';
  if (path === '/admin/transactions/create')       return 'Create Transaction';
  if (path.startsWith('/admin/transactions/'))     return 'Transaction Details';
  if (path === '/admin/reports/daily')             return 'Daily Report';
  if (path === '/admin/reports/weekly')            return 'Weekly Report';
  if (path === '/admin/reports/monthly')           return 'Monthly Report';
  if (path === '/admin/reports/client')            return 'Client Report';
  if (path === '/admin/profit')                    return 'Profit Report';
  if (path === '/admin/users')                     return 'Users';
  if (path === '/admin/activity-logs')             return 'Activity Logs';
  if (path === '/admin/settings')                  return 'Settings';
  return 'Admin';
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          pageTitle={titleFromPath(location.pathname)}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}