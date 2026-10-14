import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  Coins, Wallet, AlertCircle, Clock, Plus, ArrowRight, FileText,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

/* ============================================================
 |  Helper — Response unwrap + Safe array
 ============================================================ */
const unwrap = (res) => {
  // Laravel ApiResponse: { success: true, data: {...} }
  // অথবা সরাসরি: { ... }
  const body = res?.data ?? {};
  return body?.data ?? body ?? {};
};

const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

/* ============================================================
 |  Main Component
 ============================================================ */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.admin();

      // ✅ Debug — প্রথমবার response দেখে নিন
      console.log('🔍 Dashboard response:', res?.data);

      // ✅ Response unwrap
      const payload = unwrap(res);
      setData(payload || {});
    } catch (e) {
      console.error('❌ Admin dashboard error:', e);
      toast.error(e?.response?.data?.message || 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          title="Unable to load dashboard"
          message="Please try refreshing the page."
          action={<Button onClick={load}>Retry</Button>}
        />
      </div>
    );
  }

  // ✅ সব ডাটা safely বের করুন
  const today = data.today || {};
  const weekly = data.weekly || {};
  const monthly = data.monthly || {};
  const due = data.due || {};
  const charts = data.charts || {};

  // ✅ Critical fix — array নিশ্চিত করুন
  const recent = safeArray(data.recent_transactions);
  const openPurchases = safeArray(data.open_purchases);
  const dailyChart = safeArray(charts.daily);
  const monthlyChart = safeArray(charts.monthly);
  const clientWise = safeArray(charts.client_wise);

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* ============================================================
       |  TOP SUMMARY CARDS
       ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label="Total Clients"
          value={formatNumber(today.clients || 0)}
          sub={`${today.active_clients || 0} active`}
          icon={Users}
          tone="bg-primary-50 text-primary-600"
        />
        <StatCard
          label="Today's Purchases"
          value={formatCurrency(today.purchase_amount || 0)}
          sub={`${today.purchase_count || 0} records`}
          icon={ShoppingCart}
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Today's Sales"
          value={formatCurrency(today.sale_amount || 0)}
          sub={`${today.sale_count || 0} records`}
          icon={DollarSign}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Today's Profit"
          value={formatCurrency(today.profit_total || 0)}
          sub={`Real: ${formatCurrency(today.profit_realized || 0)}`}
          icon={TrendingUp}
          tone="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Pending Profit"
          value={formatCurrency(today.profit_pending || 0)}
          sub="From open purchases"
          icon={Clock}
          tone="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Open Purchases"
          value={formatNumber(openPurchases.length)}
          sub="Partial sales in progress"
          icon={AlertCircle}
          tone="bg-orange-50 text-orange-600"
        />
      </div>

      {/* ============================================================
       |  DUE TRACKING CARDS
       ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DueCard
          title="Payables (Sellers)"
          subtitle={`${due.payables?.count || 0} open purchase${(due.payables?.count || 0) === 1 ? '' : 's'}`}
          total={due.payables?.payable || 0}
          paid={due.payables?.paid || 0}
          due={due.payables?.due || 0}
          tone="warning"
        />
        <DueCard
          title="Receivables (Buyers)"
          subtitle={`${due.receivables?.count || 0} open sale${(due.receivables?.count || 0) === 1 ? '' : 's'}`}
          total={due.receivables?.payable || 0}
          paid={due.receivables?.paid || 0}
          due={due.receivables?.due || 0}
          tone="success"
        />
        <Card>
          <CardHeader title="Net Position" subtitle="Receivables − Payables" />
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Receivables Due</span>
              <span className="text-success-700 font-medium">
                {formatCurrency(due.receivables?.due || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Payables Due</span>
              <span className="text-warning-700 font-medium">
                {formatCurrency(due.payables?.due || 0)}
              </span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="font-medium text-slate-700">Net</span>
              <span className={`font-bold text-lg ${Number(due.net || 0) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                {formatCurrency(due.net || 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ============================================================
       |  WEEKLY / MONTHLY SUMMARY
       ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PeriodCard title="This Week" data={weekly} />
        <PeriodCard title="This Month" data={monthly} />
      </div>

      {/* ============================================================
       |  CHARTS — Daily Purchases vs Sales + Monthly Profit
       ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Daily Purchases vs Sales"
            subtitle="Last 14 days"
          />
          <div style={{ height: 280 }}>
            {dailyChart.length === 0 ? (
              <EmptyState title="No data" message="No transactions in the last 14 days." />
            ) : (
              <ResponsiveContainer>
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="purchase_usd" name="Purchase" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="sale_usd"     name="Sale"     fill="#16a34a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Monthly Profit Trend"
            subtitle="Last 12 months (realized)"
          />
          <div style={{ height: 280 }}>
            {monthlyChart.length === 0 ? (
              <EmptyState title="No data" message="No monthly data available." />
            ) : (
              <ResponsiveContainer>
                <LineChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="profit_realized"
                    name="Profit"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="purchase_usd"
                    name="Purchases"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sale_usd"
                    name="Sales"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ============================================================
       |  CLIENT-WISE ACTIVITY
       ============================================================ */}
      <Card>
        <CardHeader
          title="Client-wise Activity"
          subtitle="Last 30 days"
          action={
            <Link to="/admin/reports/client" className="btn-ghost text-sm">
              View Report <ArrowRight size={14} className="inline ml-1" />
            </Link>
          }
        />
        {clientWise.length === 0 ? (
          <EmptyState title="No client activity" message="No transactions in the last 30 days." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={clientWise}
                    dataKey="total_profit"
                    nameKey="client_name"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {clientWise.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-2">Client</th>
                    <th className="text-right p-2">Purchases</th>
                    <th className="text-right p-2">Sales</th>
                    <th className="text-right p-2">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {clientWise.slice(0, 8).map((c) => (
                    <tr key={c.client_id} className="border-t hover:bg-slate-50">
                      <td className="p-2">
                        <div className="font-medium truncate">{c.client_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{c.client_code}</div>
                      </td>
                      <td className="p-2 text-right text-primary-700">
                        {formatCurrency(c.total_receive)}
                      </td>
                      <td className="p-2 text-right text-success-700">
                        {formatCurrency(c.total_payment)}
                      </td>
                      <td className={`p-2 text-right font-medium ${Number(c.total_profit) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                        {formatCurrency(c.total_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* ============================================================
       |  OPEN PURCHASES
       ============================================================ */}
      <Card padding={false}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Open Purchases"
            subtitle="Partial sales in progress"
            action={
              <Link to="/admin/transactions?status=PARTIAL" className="btn-ghost text-sm">
                View all <ArrowRight size={14} className="inline ml-1" />
              </Link>
            }
          />
        </div>

        {openPurchases.length === 0 ? (
          <EmptyState
            title="No open purchases"
            message="All purchases are fully sold."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Txn No</th>
                  <th className="text-left p-3">Seller</th>
                  <th className="text-right p-3">Purchase</th>
                  <th className="text-right p-3">Sold</th>
                  <th className="text-right p-3">Remaining</th>
                  <th className="text-right p-3">Realized Profit</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {openPurchases.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">
                      <Link to={`/admin/transactions/${p.id}`} className="text-primary-600 hover:underline">
                        {p.transaction_no}
                      </Link>
                    </td>
                    <td className="p-3 font-medium">{p.client?.name || '—'}</td>
                    <td className="p-3 text-right">{formatCurrency(p.purchase_usd)}</td>
                    <td className="p-3 text-right text-warning-700">
                      {formatCurrency(p.sold_quantity)}
                    </td>
                    <td className="p-3 text-right text-primary-700 font-medium">
                      {formatCurrency(p.remaining_quantity)}
                    </td>
                    <td className="p-3 text-right text-success-700">
                      {formatCurrency(p.total_profit_realized)}
                    </td>
                    <td className="p-3">
                      <Badge tone={p.status}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ============================================================
       |  RECENT TRANSACTIONS
       ============================================================ */}
      <Card padding={false}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Recent Transactions"
            subtitle="Last 10"
            action={
              <Link to="/admin/transactions" className="btn-ghost text-sm">
                View all <ArrowRight size={14} className="inline ml-1" />
              </Link>
            }
          />
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            action={
              <Link to="/admin/transactions/create-purchase" className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Create Purchase
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Txn No</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Party</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">Purchase</th>
                  <th className="text-right p-3">Payable</th>
                  <th className="text-right p-3">Paid</th>
                  <th className="text-right p-3">Due</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">
                      <Link to={`/admin/transactions/${t.id}`} className="text-primary-600 hover:underline">
                        {t.transaction_no}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Badge tone={t.type === 'PURCHASE' ? 'primary' : 'success'}>
                        {t.type}
                      </Badge>
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs">
                      <div>{t.transaction_date}</div>
                      <div className="text-slate-500">{t.transaction_time}</div>
                    </td>
                    <td className="p-3">{t.client?.name || '—'}</td>
                    <td className="p-3 text-right">{formatCurrency(t.amount_usd)}</td>
                    <td className="p-3 text-right">{formatCurrency(t.purchase_usd)}</td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(t.total_payable)}
                    </td>
                    <td className="p-3 text-right text-success-700">
                      {formatCurrency(t.paid_amount)}
                    </td>
                    <td className="p-3 text-right text-danger-700">
                      {formatCurrency(t.due_amount)}
                    </td>
                    <td className="p-3">
                      <Badge tone={t.status}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================================================
 |  Sub-components
 ============================================================ */

function StatCard({ label, value, sub, icon: Icon, tone }) {
  return (
    <Card padding={false}>
      <div className="p-4">
        <div className={`h-9 w-9 rounded-lg ${tone} flex items-center justify-center mb-3`}>
          <Icon size={18} />
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-slate-900 mt-1 truncate">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5 truncate">{sub}</div>}
      </div>
    </Card>
  );
}

function DueCard({ title, subtitle, total, paid, due, tone }) {
  const toneClasses = tone === 'warning'
    ? { icon: 'bg-warning-50 text-warning-600', due: 'text-warning-700' }
    : { icon: 'bg-success-50 text-success-600', due: 'text-success-700' };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg ${toneClasses.icon} flex items-center justify-center flex-shrink-0`}>
          <Wallet size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          <div className="text-xs text-slate-500 mb-3">{subtitle}</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid</span>
              <span className="text-success-700">{formatCurrency(paid)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="text-slate-700 font-medium">Due</span>
              <span className={`font-bold ${toneClasses.due}`}>{formatCurrency(due)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PeriodCard({ title, data }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="grid grid-cols-2 gap-3">
        <PeriodMetric
          label="Purchases"
          value={formatCurrency(data.purchase_amount || 0)}
          sub={`${data.purchase_count || 0} records`}
          tone="text-primary-700"
        />
        <PeriodMetric
          label="Sales"
          value={formatCurrency(data.sale_amount || 0)}
          sub={`${data.sale_count || 0} records`}
          tone="text-success-700"
        />
        <PeriodMetric
          label="Realized Profit"
          value={formatCurrency(data.profit_realized || 0)}
          tone="text-success-700"
        />
        <PeriodMetric
          label="Pending Profit"
          value={formatCurrency(data.profit_pending || 0)}
          tone="text-warning-700"
        />
      </div>
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Total Profit</span>
          <span className={`text-base font-bold ${Number(data.profit_total || 0) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
            {formatCurrency(data.profit_total || 0)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function PeriodMetric({ label, value, sub, tone = 'text-slate-900' }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className={`text-base font-semibold mt-1 ${tone}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}