import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Coins, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import { reportService, downloadBlob } from '../../services/reportService';
import { clientService } from '../../services/clientService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ProfitReport() {
  const [months, setMonths] = useState(12);
  const [days, setDays]     = useState(30);
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState([]);

  const [dailyChart, setDailyChart] = useState([]);
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, m] = await Promise.all([
        reportService.chartDaily({ days, client_id: clientId || undefined }),
        reportService.chartMonthly({ months, client_id: clientId || undefined }),
      ]);
      setDailyChart(d.data);
      setMonthlyChart(m.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [days, months, clientId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    clientService.list({ per_page: 100 }).then((r) => setClients(r.data.items || []));
  }, []);

  const totalProfit = dailyChart.reduce((s, r) => s + Number(r.total_profit), 0);
  const totalReceive = dailyChart.reduce((s, r) => s + Number(r.total_receive), 0);
  const totalPayment = dailyChart.reduce((s, r) => s + Number(r.total_payment), 0);

  const handleExportPdf = async () => {
    const res = await reportService.exportPdf({ type: 'monthly', client_id: clientId || undefined });
    downloadBlob(res, `profit-report.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
          <Select label="Daily Range" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </Select>
          <Select label="Monthly Range" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </Select>
          <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
            ))}
          </Select>
          <Button onClick={handleExportPdf} icon={Download}>Export PDF</Button>
        </div>
      </Card>

      {loading ? (
        <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Totals for chosen range */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Receive" value={formatCurrency(totalReceive)} icon={TrendingDown} tone="bg-emerald-50 text-emerald-600" />
            <StatCard label="Total Payment" value={formatCurrency(totalPayment)} icon={TrendingUp} tone="bg-warning-50 text-warning-600" />
            <StatCard label="Total Profit"  value={formatCurrency(totalProfit)}  icon={Coins} tone="bg-sky-50 text-sky-600" />
            <StatCard label="Net Margin %"  value={totalPayment > 0 ? ((totalProfit / totalPayment) * 100).toFixed(2) + '%' : '0%'} icon={Coins} tone="bg-purple-50 text-purple-600" />
          </div>

          {/* Monthly profit chart */}
          <Card>
            <CardHeader title="Monthly Profit Trend" subtitle={`Last ${months} months`} />
            <div style={{ height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="total_profit"  name="Profit"  stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="total_receive" name="Receive" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="total_payment" name="Payment" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Daily profit chart */}
          <Card>
            <CardHeader title="Daily Profit" subtitle={`Last ${days} days`} />
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total_profit" name="Profit" fill="#16a34a" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <Card padding={false}>
      <div className="p-4">
        <div className={`h-9 w-9 rounded-lg ${tone} flex items-center justify-center mb-3`}>
          <Icon size={18} />
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-slate-900 mt-1">{value}</div>
      </div>
    </Card>
  );
}