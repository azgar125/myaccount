import { useAuth } from './useAuth';

export function usePermissions() {
  const { user, isAdmin, isClient } = useAuth();

  return {
    isAdmin,
    isClient,
    canAccessAdmin: isAdmin,
    canAccessClient: isClient,
    canManageClients: isAdmin,
    canManageTransactions: isAdmin,
    canManageUsers: isAdmin,
    canViewReports: !!user,
    canExport: !!user,
  };
}