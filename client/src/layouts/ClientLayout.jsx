import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

function titleFromPath(path) {
  if (path.startsWith('/client/dashboard'))    return 'My Dashboard';
  if (path === '/client/profile')              return 'My Profile';
  if (path === '/client/accounts')             return 'My Accounts';
  if (path === '/client/transactions')         return 'My Transactions';
  if (path === '/client/reports')              return 'My Reports';
  if (path === '/client/statements')           return 'Statements';
  return 'Client';
}

export default function ClientLayout() {
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