import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { clientPortalService } from '../../services/clientPortalService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ClientTransactions() {
  const [items, setItems] = useState([]);
  const [meta, setMeta]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientPortalService.transactions({
        page, per_page: perPage,
        search: filters.search || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      });
      setItems(res.data.items || []);
      setMeta(res.data.meta || null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filters]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Input label="Search" icon={Search} placeholder="Txn No, reference..."
            value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />

          <Select label="Type" value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="RECEIVE">Receive</option>
            <option value="PAYMENT">Payment</option>
            <option value="TRANSFER">Transfer</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </Select>

          <Select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="FAILED">Failed</option>
          </Select>

          <Input label="From" type="date" value={filters.date_from}
            onChange={(e) => updateFilter('date_from', e.target.value)} />

          <Input label="To" type="date" value={filters.date_to}
            onChange={(e) => updateFilter('date_to', e.target.value)} />
        </div>

        <div className="mt-3">
          <Button variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="No transactions" message="Try changing filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Txn No</th>
                    <th className="text-left p-3">Date / Time</th>
                    <th className="text-left p-3 hidden md:table-cell">Account</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-right p-3">Receive</th>
                    <th className="text-right p-3">Payment</th>
                    <th className="text-right p-3">Profit</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{t.transaction_no}</td>
                      <td className="p-3 whitespace-nowrap text-xs">
                        <div>{t.transaction_date}</div>
                        <div className="text-slate-500">{t.transaction_time}</div>
                      </td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs">
                        {t.account?.masked_number || '-'}
                      </td>
                      <td className="p-3 text-right">{formatCurrency(t.amount)}</td>
                      <td className="p-3 text-right text-primary-700">{formatCurrency(t.receive_amount)}</td>
                      <td className="p-3 text-right text-warning-700">{formatCurrency(t.payment_amount)}</td>
                      <td className={`p-3 text-right font-medium ${Number(t.profit) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                        {formatCurrency(t.profit)}
                      </td>
                      <td className="p-3"><Badge tone={t.status}>{t.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="px-4 pb-4">
                <Pagination
                  page={meta.current_page}
                  lastPage={meta.last_page}
                  total={meta.total}
                  perPage={perPage}
                  onChange={setPage}
                  onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}