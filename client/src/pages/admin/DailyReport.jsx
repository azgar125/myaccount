import { useEffect, useState, useCallback } from 'react';
import { Download, Printer, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { reportService, downloadBlob } from '../../services/reportService';
import { clientService } from '../../services/clientService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import { todayISO } from '../../utils/dateUtils';

export default function DailyReport() {
  const [date, setDate] = useState(todayISO());
  const [clientId, setClientId] = useState('');
  const [type, setType] = useState('');
  const [clients, setClients] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.daily({
        date,
        client_id: clientId || undefined,
        type: type || undefined,
      });
      setData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [date, clientId, type]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    clientService.list({ per_page: 100 }).then((r) => setClients(r.data.items || []));
  }, []);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res = await reportService.exportPdf({
        type: 'daily', date,
        client_id: clientId || undefined,
      });
      downloadBlob(res, `daily-report-${date}.pdf`);
    } catch { toast.error('PDF export failed'); }
    finally { setExporting(false); }
  };

  const handleExportExcel = async () => {
    try {
      const res = await reportService.exportExcel({
        type: 'daily', date,
        client_id: clientId || undefined,
      });
      downloadBlob(res, `daily-report-${date}.xlsx`);
    } catch { toast.error('Excel export failed'); }
  };

  const handlePrint = () => {
    window.open(
      reportService.printUrl({ type: 'daily', date, client_id: clientId || undefined }),
      '_blank'
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filters */}
      <Card className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
            ))}
          </Select>
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="PURCHASE">Purchase</option>
            <option value="SALE">Sale</option>
          </Select>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={load} icon={RefreshCw} variant="secondary">Refresh</Button>
            <Button onClick={handleExportPdf} icon={Download} loading={exporting}>PDF</Button>
            <Button onClick={handleExportExcel} variant="secondary">Excel</Button>
            <Button onClick={handlePrint} variant="ghost" icon={Printer}>Print</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Transactions" value={formatNumber(data.totals.total_transactions)} />
            <StatCard
              label="Total Purchase"
              value={formatCurrency(data.totals.total_receive)}
              tone="text-primary-700"
            />
            <StatCard
              label="Total Payment"
              value={formatCurrency(data.totals.total_payment)}
              tone="text-warning-700"
            />
            <StatCard
              label="Total Profit"
              value={formatCurrency(data.totals.total_profit)}
              tone="text-success-700"
              highlight
            />
          </div>

          {/* Table */}
          <Card padding={false}>
            <div className="p-4 sm:p-5 print:pb-2">
              <CardHeader
                title={`Daily Report — ${data.date}`}
                subtitle={`${data.rows?.length || 0} transactions`}
              />
            </div>

            {!data.rows || data.rows.length === 0 ? (
              <EmptyState title="No transactions" message="No records for this day." icon={FileText} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="text-left p-3">Txn No</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Party</th>
                      <th className="text-left p-3 hidden md:table-cell">Account</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-right p-3">Purchase</th>
                      <th className="text-right p-3">%</th>
                      <th className="text-right p-3">Payable</th>
                      <th className="text-right p-3">Paid</th>
                      <th className="text-right p-3">Due</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((t) => (
                      <tr key={t.id} className="border-t hover:bg-slate-50">
                        <td className="p-3 font-mono text-xs">{t.transaction_no}</td>
                        <td className="p-3">
                          <Badge tone={t.type === 'PURCHASE' ? 'primary' : 'success'}>{t.type}</Badge>
                        </td>
                        <td className="p-3 text-xs">{t.transaction_time}</td>
                        <td className="p-3">{t.client?.name}</td>
                        <td className="p-3 hidden md:table-cell font-mono text-xs">
                          {t.account?.masked_number || '-'}
                        </td>
                        <td className="p-3 text-right">{formatCurrency(t.amount_usd)}</td>
                        <td className="p-3 text-right text-slate-700">{formatCurrency(t.purchase_usd)}</td>
                        <td className="p-3 text-right text-slate-500">{t.percentage}%</td>
                        <td className="p-3 text-right text-primary-700">{formatCurrency(t.total_payable)}</td>
                        <td className="p-3 text-right text-success-700">{formatCurrency(t.paid_amount)}</td>
                        <td className="p-3 text-right text-danger-700">{formatCurrency(t.due_amount)}</td>
                        <td className="p-3"><Badge tone={t.status}>{t.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold">
                    <tr className="border-t-2 border-slate-200">
                      <td className="p-3" colSpan={5}>TOTAL</td>
                      <td className="p-3 text-right">{formatCurrency(data.totals.total_amount)}</td>
                      <td colSpan={2}></td>
                      <td className="p-3 text-right text-primary-700">{formatCurrency(data.totals.total_receive)}</td>
                      <td className="p-3 text-right text-success-700">-</td>
                      <td className="p-3 text-right text-danger-700">-</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
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