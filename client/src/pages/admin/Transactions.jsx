import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Eye, Trash2, RefreshCw, ShoppingCart, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { transactionService } from '../../services/transactionService';
import { clientService } from '../../services/clientService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function Transactions() {
  const [params] = useSearchParams();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [filters, setFilters] = useState({
    search: '',
    client_id: params.get('client_id') || '',
    type: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionService.list({
        page, per_page: perPage,
        search: filters.search || undefined,
        client_id: filters.client_id || undefined,
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

  useEffect(() => {
    clientService.list({ per_page: 100 }).then((r) => setClients(r.data.items || []));
  }, []);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await transactionService.remove(confirmDel.id);
      toast.success('Transaction deleted');
      setConfirmDel(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Input
            label="Search"
            icon={Search}
            placeholder="Txn No, client, reference"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />

          <Select label="Client" value={filters.client_id} onChange={(e) => updateFilter('client_id', e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
            ))}
          </Select>

          <Select label="Type" value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="PURCHASE">Purchase</option>
            <option value="SALE">Sale</option>
          </Select>

          <Select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="PARTIAL">Partial</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>

          <Input label="Date From" type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} />
          <Input label="Date To"   type="date" value={filters.date_to}   onChange={(e) => updateFilter('date_to', e.target.value)} />

          <div className="flex gap-2 items-end md:col-span-2 lg:col-span-2 flex-wrap">
            <Button variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button>
            <Link to="/admin/transactions/create-purchase" className="btn-primary inline-flex items-center gap-2">
              <ShoppingCart size={16} /> New Purchase
            </Link>
            <Link to="/admin/transactions/create-sale" className="btn-success inline-flex items-center gap-2">
              <DollarSign size={16} /> New Sale
            </Link>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="No transactions" message="Try changing filters or create one." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Txn No</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Party</th>
                    <th className="text-left p-3 hidden md:table-cell">Account</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-right p-3">Purchase</th>
                    <th className="text-right p-3">%</th>
                    <th className="text-right p-3">Payable</th>
                    <th className="text-right p-3">Paid</th>
                    <th className="text-right p-3">Due</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{t.transaction_no}</td>
                      <td className="p-3">
                        <Badge tone={t.type === 'PURCHASE' ? 'primary' : 'success'}>{t.type}</Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs">
                        <div>{t.transaction_date}</div>
                        <div className="text-slate-500">{t.transaction_time}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{t.client?.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{t.client?.client_code}</div>
                      </td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs">
                        {t.account?.masked_number || '-'}
                      </td>
                      <td className="p-3 text-right">{formatCurrency(t.amount_usd)}</td>
                      <td className="p-3 text-right">{formatCurrency(t.purchase_usd)}</td>
                      <td className="p-3 text-right text-slate-500">{t.percentage}%</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(t.total_payable)}</td>
                      <td className="p-3 text-right text-success-700">{formatCurrency(t.paid_amount)}</td>
                      <td className="p-3 text-right text-danger-700">{formatCurrency(t.due_amount)}</td>
                      <td className="p-3">
                        <Badge tone={t.status}>{t.status}</Badge>
                        <Badge
                          tone={t.payment_status === 'PAID' ? 'success' : t.payment_status === 'PARTIAL' ? 'warning' : 'default'}
                          className="ml-1"
                        >
                          {t.payment_status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/transactions/${t.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                            title="View"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => setConfirmDel(t)}
                            className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
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

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={`Delete ${confirmDel?.transaction_no}?`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}