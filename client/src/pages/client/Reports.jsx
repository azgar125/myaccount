import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import { clientPortalService } from '../../services/clientPortalService';
import { formatCurrency } from '../../utils/formatCurrency';
import { startOfMonthISO, todayISO } from '../../utils/dateUtils';

export default function ClientReports() {
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo]     = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await clientPortalService.reports({ from, to });
      setData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To"   type="date" value={to}   onChange={(e) => setTo(e.target.value)} />
          <div>
            <Button onClick={load}>Load Report</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Transactions" value={data.totals.total_transactions} />
            <SummaryCard label="Receive" value={formatCurrency(data.totals.total_receive)} tone="text-primary-700" />
            <SummaryCard label="Payment" value={formatCurrency(data.totals.total_payment)} tone="text-warning-700" />
            <SummaryCard label="Profit" value={formatCurrency(data.totals.total_profit)} tone="text-success-700" highlight />
          </div>

          {/* Period summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <PeriodMini title="Today"   data={data.summary.today} />
            <PeriodMini title="This Week"  data={data.summary.weekly} />
            <PeriodMini title="This Month" data={data.summary.monthly} />
          </div>

          {/* Chart */}
          <Card>
            <CardHeader title="Daily Breakdown" subtitle={`${data.from} → ${data.to}`} />
            <div style={{ height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={data.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total_receive" name="Receive" fill="#2563eb" radius={[3,3,0,0]} />
                  <Bar dataKey="total_payment" name="Payment" fill="#f59e0b" radius={[3,3,0,0]} />
                  <Bar dataKey="total_profit"  name="Profit"  fill="#16a34a" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Table */}
          <Card padding={false}>
            <div className="p-4 sm:p-5">
              <CardHeader title="Daily Details" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-right p-3">Txn</th>
                    <th className="text-right p-3">Receive</th>
                    <th className="text-right p-3">Payment</th>
                    <th className="text-right p-3">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.days.map((d) => (
                    <tr key={d.date} className="border-t hover:bg-slate-50">
                      <td className="p-3">{d.date}</td>
                      <td className="p-3 text-right">{d.total_transactions}</td>
                      <td className="p-3 text-right text-primary-700">{formatCurrency(d.total_receive)}</td>
                      <td className="p-3 text-right text-warning-700">{formatCurrency(d.total_payment)}</td>
                      <td className={`p-3 text-right font-medium ${Number(d.total_profit) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                        {formatCurrency(d.total_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, tone = 'text-slate-900', highlight = false }) {
  return (
    <Card padding={false} className={highlight ? 'border-success-200' : ''}>
      <div className="p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className={`text-lg font-bold mt-1 ${tone}`}>{value}</div>
      </div>
    </Card>
  );
}

function PeriodMini({ title, data }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="space-y-2 text-sm">
        <Row label="Receive" value={formatCurrency(data.total_receive)} tone="text-primary-700" />
        <Row label="Payment" value={formatCurrency(data.total_payment)} tone="text-warning-700" />
        <Row label="Profit"  value={formatCurrency(data.total_profit)}  tone="text-success-700" />
      </div>
    </Card>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${tone}`}>{value}</span>
    </div>
  );
}