import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight, FileText,
  TrendingUp, UserCog, History, Settings, User, Receipt, X, Wallet,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/* ============================================================
 |  Admin menu — full access
 ============================================================ */
const ADMIN_MENU = [
  { group: 'Main', items: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { group: 'Manage', items: [
    { to: '/admin/clients',      label: 'Clients',       icon: Users },
    { to: '/admin/accounts',     label: 'Accounts',      icon: CreditCard },
    { to: '/admin/transactions', label: 'Transactions',  icon: ArrowLeftRight },
  ]},
  { group: 'Reports', items: [
    { to: '/admin/reports/daily',   label: 'Daily Report',   icon: FileText },
    { to: '/admin/reports/weekly',  label: 'Weekly Report',  icon: FileText },
    { to: '/admin/reports/monthly', label: 'Monthly Report', icon: FileText },
    { to: '/admin/statements',      label: 'Statements',     icon: Receipt },
    { to: '/admin/profit',          label: 'Profit',         icon: TrendingUp },
  ]},
  { group: 'System', items: [
    { to: '/admin/users',         label: 'Users',         icon: UserCog },
    { to: '/admin/activity-logs', label: 'Activity Logs', icon: History },
    { to: '/admin/settings',      label: 'Settings',      icon: Settings },
  ]},
];

/* ============================================================
 |  Client menu — restricted
 ============================================================ */
const CLIENT_MENU = [
  { group: 'Main', items: [
    { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { group: 'My Account', items: [
    { to: '/client/profile',      label: 'Profile',      icon: User },
    { to: '/client/accounts',     label: 'My Accounts',  icon: Wallet },
    { to: '/client/transactions', label: 'Transactions', icon: ArrowLeftRight },
  ]},
  { group: 'Reports', items: [
    { to: '/client/reports',    label: 'Reports',    icon: FileText },
    { to: '/client/statements', label: 'Statements', icon: Receipt },
  ]},
];

export default function Sidebar({ open, onClose }) {
  const { isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();

  const menu = isAdmin ? ADMIN_MENU : CLIENT_MENU;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-40',
          'flex flex-col transition-transform duration-200 ease-out',
          'md:translate-x-0 md:static md:z-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              CA
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">Accounting</div>
              <div className="text-xs text-slate-500 truncate">
                {isAdmin ? 'Admin Panel' : 'Client Panel'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {menu.map((section) => (
            <div key={section.group} className="mb-4 last:mb-0">
              <div className="px-5 mb-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                {section.group}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2',
                        isActive
                          ? 'bg-primary-50 text-primary-700 border-primary-600 font-medium'
                          : 'text-slate-600 hover:bg-slate-50 border-transparent'
                      )
                    }
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.role}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 flex-shrink-0"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}