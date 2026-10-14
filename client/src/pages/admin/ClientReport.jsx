import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { reportService } from '../../services/reportService';
import { clientService } from '../../services/clientService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';

export default function ClientReport() {
  const [params] = useSearchParams();
  const [clientId, setClientId] = useState(params.get('client_id') || '');
  const [clients, setClients] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!clientId) { setData(null); return; }
    setLoading(true);
    try {
      const res = await reportService.client(clientId);
      setData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    clientService.list({ per_page: 100 }).then((r) => setClients(r.data.items || []));
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:items-end">
          <Select label="Select Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Choose client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
            ))}
          </Select>
          <div>
            <Button onClick={load} disabled={!clientId}>Load Report</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
      ) : !clientId ? (
        <EmptyState title="Select a client" message="Choose a client to view their detailed report." />
      ) : data ? (
        <>
          {/* Client header */}
          <Card>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{data.client.name}</h2>
                <div className="text-sm text-slate-500 font-mono mt-1">{data.client.client_code}</div>
              </div>
              <div className="flex gap-2">
                <Badge tone={data.client.status}>{data.client.status}</Badge>
                <Link to={`/admin/clients/${data.client.id}`} className="btn-secondary text-sm">
                  View Client
                </Link>
              </div>
            </div>
          </Card>

          {/* Summary grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryBlock title="All Time"   data={data.summary.all_time} highlight />
            <SummaryBlock title="This Month" data={data.summary.monthly} />
            <SummaryBlock title="This Week"  data={data.summary.weekly} />
            <SummaryBlock title="Today"      data={data.summary.today} />
          </div>

          {/* Recent transactions */}
          <Card padding={false}>
            <div className="p-4 sm:p-5">
              <CardHeader
                title="Recent Transactions"
                subtitle={`Last ${data.recent?.length || 0} transactions`}
                action={
                  <Link to={`/admin/transactions?client_id=${data.client.id}`} className="btn-ghost text-sm">
                    View all
                  </Link>
                }
              />
            </div>

            {!data.recent || data.recent.length === 0 ? (
              <EmptyState title="No transactions" />
            ) : (
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
                      <th className="text-right p-3">Due</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((t) => (
                      <tr key={t.id} className="border-t hover:bg-slate-50">
                        <td className="p-3 font-mono text-xs">
                          <Link to={`/admin/transactions/${t.id}`} className="text-primary-600 hover:underline">
                            {t.transaction_no}
                          </Link>
                        </td>
                        <td className="p-3">
                          <Badge tone={t.type === 'PURCHASE' ? 'primary' : 'success'}>{t.type}</Badge>
                        </td>
                        <td className="p-3 whitespace-nowrap text-xs">
                          <div>{t.transaction_date}</div>
                          <div className="text-slate-500">{t.transaction_time}</div>
                        </td>
                        <td className="p-3 hidden md:table-cell font-mono text-xs">
                          {t.account?.masked_number || '-'}
                        </td>
                        <td className="p-3 text-right">{formatCurrency(t.amount_usd)}</td>
                        <td className="p-3 text-right">{formatCurrency(t.purchase_usd)}</td>
                        <td className="p-3 text-right text-slate-500">{t.percentage}%</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(t.total_payable)}</td>
                        <td className="p-3 text-right text-danger-700">{formatCurrency(t.due_amount)}</td>
                        <td className="p-3"><Badge tone={t.status}>{t.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function SummaryBlock({ title, data, highlight = false }) {
  return (
    <Card className={highlight ? 'border-success-200' : ''}>
      <CardHeader title={title} />
      <div className="space-y-2 text-sm">
        <Row label="Transactions" value={formatNumber(data.total_transactions)} />
        <Row label="Purchase"     value={formatCurrency(data.total_receive)} tone="text-primary-700" />
        <Row label="Payment"      value={formatCurrency(data.total_payment)} tone="text-warning-700" />
        <Row label="Profit"       value={formatCurrency(data.total_profit)}  tone="text-success-700" bold />
      </div>
    </Card>
  );
}

function Row({ label, value, tone = 'text-slate-800', bold = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${tone}`}>{value}</span>
    </div>
  );
}