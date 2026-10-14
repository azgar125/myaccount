import { useEffect, useState, useCallback } from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { reportService, downloadBlob } from '../../services/reportService';
import { clientService } from '../../services/clientService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import { startOfWeekISO, endOfWeekISO } from '../../utils/dateUtils';

export default function WeeklyReport() {
  const [start, setStart] = useState(startOfWeekISO());
  const [end, setEnd]     = useState(endOfWeekISO());
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.weekly({
        start, end,
        client_id: clientId || undefined,
      });
      setData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [start, end, clientId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    clientService.list({ per_page: 100 }).then((r) => setClients(r.data.items || []));
  }, []);

  const handleExportPdf = async () => {
    const res = await reportService.exportPdf({ type: 'weekly', start, end, client_id: clientId || undefined });
    downloadBlob(res, `weekly-${start}-${end}.pdf`);
  };

  const handleExportExcel = async () => {
    const res = await reportService.exportExcel({ type: 'weekly', start, end, client_id: clientId || undefined });
    downloadBlob(res, `weekly-${start}-${end}.xlsx`);
  };

  const handlePrint = () => {
    window.open(
      reportService.printUrl({ type: 'weekly', start, end, client_id: clientId || undefined }),
      '_blank'
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
          <Input label="Start Date" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input label="End Date"   type="date" value={end}   onChange={(e) => setEnd(e.target.value)} />
          <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
            ))}
          </Select>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={load} icon={RefreshCw} variant="secondary">Refresh</Button>
            <Button onClick={handleExportPdf} icon={Download}>PDF</Button>
            <Button onClick={handleExportExcel} variant="secondary">Excel</Button>
            <Button onClick={handlePrint} variant="ghost" icon={Printer}>Print</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Transactions"  value={formatNumber(data.totals.total_transactions)} />
            <StatCard label="Total Purchase" value={formatCurrency(data.totals.total_receive)} tone="text-primary-700" />
            <StatCard label="Total Payment"  value={formatCurrency(data.totals.total_payment)} tone="text-warning-700" />
            <StatCard label="Total Profit"   value={formatCurrency(data.totals.total_profit)}  tone="text-success-700" highlight />
          </div>

          <Card>
            <CardHeader title="Daily Breakdown" subtitle={`${data.start_date} → ${data.end_date}`} />
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total_receive" name="Purchase" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="total_payment" name="Payment"  fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="total_profit"  name="Profit"   fill="#16a34a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding={false}>
            <div className="p-4 sm:p-5">
              <CardHeader title="Day-by-day Details" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-right p-3">Txn</th>
                    <th className="text-right p-3">Purchase</th>
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
                <tfoot className="bg-slate-50 font-semibold">
                  <tr className="border-t-2 border-slate-200">
                    <td className="p-3">TOTAL</td>
                    <td className="p-3 text-right">{data.totals.total_transactions}</td>
                    <td className="p-3 text-right text-primary-700">{formatCurrency(data.totals.total_receive)}</td>
                    <td className="p-3 text-right text-warning-700">{formatCurrency(data.totals.total_payment)}</td>
                    <td className="p-3 text-right text-success-700">{formatCurrency(data.totals.total_profit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, tone = 'text-slate-900', highlight = false }) {
  return (
    <Card padding={false} className={highlight ? 'border-success-200' : ''}>
      <div className="p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className={`text-lg font-bold mt-1 ${tone}`}>{value}</div>
      </div>
    </Card>
  );
}