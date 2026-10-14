import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

import Login from '../pages/auth/Login';
import AdminLayout from '../layouts/AdminLayout';
import ClientLayout from '../layouts/ClientLayout';

import AdminDashboard from '../pages/admin/Dashboard';
import Clients from '../pages/admin/Clients';
import ClientDetails from '../pages/admin/ClientDetails';
import Accounts from '../pages/admin/Accounts';
import Transactions from '../pages/admin/Transactions';
import CreatePurchase from '../pages/admin/CreatePurchase';
import CreateSale from '../pages/admin/CreateSale';
import TransactionDetails from '../pages/admin/TransactionDetails';
import DailyReport from '../pages/admin/DailyReport';
import WeeklyReport from '../pages/admin/WeeklyReport';
import MonthlyReport from '../pages/admin/MonthlyReport';
import ProfitReport from '../pages/admin/ProfitReport';
import ClientReport from '../pages/admin/ClientReport';
import Users from '../pages/admin/Users';
import Settings from '../pages/admin/Settings';
import ActivityLogs from '../pages/admin/ActivityLogs';
import AdminStatements from '../pages/admin/Statements';

import ClientDashboard from '../pages/client/Dashboard';
import ClientProfile from '../pages/client/Profile';
import ClientAccounts from '../pages/client/Accounts';
import ClientTransactions from '../pages/client/Transactions';
import ClientReports from '../pages/client/Reports';
import Statements from '../pages/client/Statements';

export default function AppRoutes() {
  const { user, loading } = useAuth();

  const redirectByRole = (u) =>
    String(u?.role || '').toUpperCase() === 'ADMIN'
      ? '/admin/dashboard'
      : '/client/dashboard';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          loading ? null : user ? (
            <Navigate to={redirectByRole(user)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard"            element={<AdminDashboard />} />
          <Route path="/admin/clients"              element={<Clients />} />
          <Route path="/admin/clients/:id"          element={<ClientDetails />} />
          <Route path="/admin/accounts"             element={<Accounts />} />
          <Route path="/admin/transactions"         element={<Transactions />} />
          <Route path="/admin/transactions/create-purchase" element={<CreatePurchase />} />
          <Route path="/admin/transactions/create-sale"     element={<CreateSale />} />
          <Route path="/admin/transactions/:id"     element={<TransactionDetails />} />
          <Route path="/admin/reports/daily"        element={<DailyReport />} />
          <Route path="/admin/reports/weekly"       element={<WeeklyReport />} />
          <Route path="/admin/reports/monthly"      element={<MonthlyReport />} />
          <Route path="/admin/reports/client"       element={<ClientReport />} />
          <Route path="/admin/profit"               element={<ProfitReport />} />
          <Route path="/admin/statements"           element={<AdminStatements />} />
          <Route path="/admin/users"                element={<Users />} />
          <Route path="/admin/activity-logs"        element={<ActivityLogs />} />
          <Route path="/admin/settings"             element={<Settings />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="CLIENT" />}>
        <Route element={<ClientLayout />}>
          <Route path="/client/dashboard"    element={<ClientDashboard />} />
          <Route path="/client/profile"      element={<ClientProfile />} />
          <Route path="/client/accounts"     element={<ClientAccounts />} />
          <Route path="/client/transactions" element={<ClientTransactions />} />
          <Route path="/client/reports"      element={<ClientReports />} />
          <Route path="/client/statements"   element={<Statements />} />
        </Route>
      </Route>

      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800">404</h1>
            <p className="text-slate-500 mt-2">Page not found</p>
            <a href="/" className="btn-primary mt-4 inline-flex">Go home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}