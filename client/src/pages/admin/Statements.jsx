import { useEffect, useState } from 'react';
import { Download, Printer, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { clientService } from '../../services/clientService';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/formatCurrency';
import { todayISO, startOfMonthISO } from '../../utils/dateUtils';
import Select from '../../components/common/Select';

export default function Statements() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo] = useState(todayISO());

  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ purchase: 0, sale: 0, payable: 0, paid: 0, due: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clientService.list({ per_page: 100 }).then((r) => setClients(r.data.items || []));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await transactionService.list({
        client_id: clientId || undefined,
        date_from: from,
        date_to: to,
        per_page: 100,
        sort_by: 'transaction_date',
        sort_dir: 'asc',
      });

      const items = res.data.items || [];
      setRows(items);

      const t = items.reduce(
        (acc, r) => {
          const purchase = Number(r.purchase_usd) || 0;
          const payable  = Number(r.total_payable) || 0;
          const paid     = Number(r.paid_amount) || 0;
          const due      = Number(r.due_amount) || 0;

          if (r.type === 'PURCHASE') acc.purchase += purchase;
          if (r.type === 'SALE')     acc.sale     += purchase;

          acc.payable += payable;
          acc.paid    += paid;
          acc.due     += due;

          return acc;
        },
        { purchase: 0, sale: 0, payable: 0, paid: 0, due: 0 }
      );

      setTotals(t);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (clientId) load(); }, [clientId, from, to]);

  const handlePrint = () => window.print();

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filters */}
      <Card className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
          <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Choose client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
            ))}
          </Select>
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To"   type="date" value={to}   onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={load} variant="secondary" icon={RefreshCw} disabled={!clientId}>Load</Button>
            <Button onClick={handlePrint} variant="ghost" icon={Printer} disabled={!rows.length}>Print</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
      ) : !clientId ? (
        <EmptyState
          title="Select a client"
          message="Choose a client and date range to view their statement."
          icon={FileText}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No transactions"
          message="No records found for this period."
          icon={FileText}
        />
      ) : (
        <>
          {/* Header */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Account Statement</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Period: <span className="font-medium text-slate-700">{from}</span> →{' '}
                  <span className="font-medium text-slate-700">{to}</span>
                </p>
              </div>
              <div className="text-sm text-slate-500">
                Generated: {new Date().toLocaleString()}
              </div>
            </div>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <SummaryCard label="Transactions" value={rows.length} />
            <SummaryCard label="Total Purchase" value={formatCurrency(totals.purchase)} tone="text-primary-700" />
            <SummaryCard label="Total Sale"     value={formatCurrency(totals.sale)}     tone="text-success-700" />
            <SummaryCard label="Total Payable"  value={formatCurrency(totals.payable)} />
            <SummaryCard label="Total Due"      value={formatCurrency(totals.due)}      tone="text-danger-700" highlight />
          </div>

          {/* Table */}
          <Card padding={false}>
            <div className="p-4 sm:p-5 print:pb-2">
              <CardHeader title="Statement Details" subtitle={`${rows.length} records`} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Txn No</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Date</th>
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
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{r.transaction_no}</td>
                      <td className="p-3">
                        <Badge tone={r.type === 'PURCHASE' ? 'primary' : 'success'}>{r.type}</Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs">
                        <div>{r.transaction_date}</div>
                        <div className="text-slate-500">{r.transaction_time}</div>
                      </td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs">
                        {r.account?.masked_number || '-'}
                      </td>
                      <td className="p-3 text-right">{formatCurrency(r.amount_usd)}</td>
                      <td className="p-3 text-right text-primary-700">{formatCurrency(r.purchase_usd)}</td>
                      <td className="p-3 text-right text-slate-500">{r.percentage}%</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(r.total_payable)}</td>
                      <td className="p-3 text-right text-success-700">{formatCurrency(r.paid_amount)}</td>
                      <td className="p-3 text-right text-danger-700">{formatCurrency(r.due_amount)}</td>
                      <td className="p-3"><Badge tone={r.status}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold">
                  <tr className="border-t-2 border-slate-200">
                    <td className="p-3" colSpan={5}>TOTAL</td>
                    <td className="p-3 text-right text-primary-700">{formatCurrency(totals.purchase)}</td>
                    <td></td>
                    <td className="p-3 text-right">{formatCurrency(totals.payable)}</td>
                    <td className="p-3 text-right text-success-700">{formatCurrency(totals.paid)}</td>
                    <td className="p-3 text-right text-danger-700">{formatCurrency(totals.due)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <div className="hidden print:block text-center text-xs text-slate-500 mt-4">
            This is a computer-generated statement. No signature required.
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone = 'text-slate-900', highlight = false }) {
  return (
    <Card padding={false} className={highlight ? 'border-danger-200' : ''}>
      <div className="p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className={`text-lg font-bold mt-1 ${tone}`}>{value}</div>
      </div>
    </Card>
  );
}