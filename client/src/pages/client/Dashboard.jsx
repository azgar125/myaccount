import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp, Coins, Receipt, Wallet, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { clientPortalService } from '../../services/clientPortalService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await clientPortalService.dashboard();
        setData(res.data);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;
  }
  if (!data) return null;

  const t = data.today;

  const cards = [
    { label: "Today's Receive", value: formatCurrency(t.receive), icon: TrendingDown, tone: 'bg-emerald-50 text-emerald-600' },
    { label: "Today's Payment", value: formatCurrency(t.payment), icon: TrendingUp,   tone: 'bg-warning-50 text-warning-600' },
    { label: "Today's Profit",  value: formatCurrency(t.profit),  icon: Coins,        tone: 'bg-sky-50 text-sky-600' },
    { label: "Transactions",    value: formatNumber(t.transactions), icon: Receipt,   tone: 'bg-purple-50 text-purple-600' },
  ];

  const recent = data.recent_transactions || [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Welcome */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Welcome, {user?.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Here's a summary of your account activity.</p>
          </div>
          <Link to="/client/statements" className="btn-secondary inline-flex items-center gap-2">
            <Download size={16} /> Download Statement
          </Link>
        </div>
      </Card>

      {/* Today summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => (
          <Card key={c.label} padding={false}>
            <div className="p-4">
              <div className={`h-9 w-9 rounded-lg ${c.tone} flex items-center justify-center mb-3`}>
                <c.icon size={18} />
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</div>
              <div className="text-lg font-bold text-slate-900 mt-1 truncate">{c.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly / Monthly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PeriodCard title="This Week"  data={data.weekly} />
        <PeriodCard title="This Month" data={data.monthly} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader title="My Activity" subtitle="Receive vs Payment" />
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={[data.today]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="receive" name="Receive" fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="payment" name="Payment" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent transactions */}
      <Card padding={false}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Recent Transactions"
            subtitle="Last 10"
            action={<Link to="/client/transactions" className="btn-ghost text-sm">View all</Link>}
          />
        </div>

        {recent.length === 0 ? (
          <EmptyState title="No transactions yet" message="Your transactions will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Txn No</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3 hidden md:table-cell">Account</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">Receive</th>
                  <th className="text-right p-3">Payment</th>
                  <th className="text-right p-3">Profit</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">{row.transaction_no}</td>
                    <td className="p-3 whitespace-nowrap text-xs">
                      <div>{row.transaction_date}</div>
                      <div className="text-slate-500">{row.transaction_time}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell font-mono text-xs">
                      {row.account?.masked_number || '-'}
                    </td>
                    <td className="p-3 text-right">{formatCurrency(row.amount)}</td>
                    <td className="p-3 text-right text-primary-700">{formatCurrency(row.receive_amount)}</td>
                    <td className="p-3 text-right text-warning-700">{formatCurrency(row.payment_amount)}</td>
                    <td className={`p-3 text-right font-medium ${Number(row.profit) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="p-3"><Badge tone={row.status}>{row.status}</Badge></td>
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

function PeriodCard({ title, data }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Receive" value={formatCurrency(data.receive)} tone="text-primary-700" />
        <Metric label="Payment" value={formatCurrency(data.payment)} tone="text-warning-700" />
        <Metric label="Profit"  value={formatCurrency(data.profit)}  tone="text-success-700" />
      </div>
    </Card>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className={`text-base font-semibold mt-1 ${tone}`}>{value}</div>
    </div>
  );
}