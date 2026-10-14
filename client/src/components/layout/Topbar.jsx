import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';

export default function Topbar({ onToggleSidebar, pageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const profilePath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/client/profile';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 sticky top-0 z-20">
      {/* Hamburger (mobile) */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="md:hidden p-2 -ml-2 mr-2 rounded-lg text-slate-500 hover:bg-slate-100"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate flex-1">
        {pageTitle || 'Dashboard'}
      </h1>

      {/* Right side */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-slate-800 leading-tight truncate max-w-[140px]">
              {user?.name}
            </div>
            <div className="text-xs text-slate-500 leading-tight">{user?.role}</div>
          </div>
          <ChevronDown
            size={16}
            className={clsx(
              'text-slate-400 transition-transform hidden sm:block',
              menuOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="text-sm font-medium text-slate-800 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate(profilePath);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
            >
              <User size={16} />
              Profile
            </button>

            <div className="border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 text-left"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}