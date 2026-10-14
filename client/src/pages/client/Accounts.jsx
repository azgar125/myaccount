import { useEffect, useState, useCallback } from 'react';
import { Search, CreditCard, Wallet, RefreshCw } from 'lucide-react';
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

export default function ClientAccounts() {
  const [items, setItems] = useState([]);
  const [meta, setMeta]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientPortalService.accounts({
        page, per_page: perPage,
        search: search || undefined,
        status: status || undefined,
      });
      setItems(res.data.items || []);
      setMeta(res.data.meta || null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:items-end">
          <Input label="Search" icon={Search} placeholder="Account name, provider, last4..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

          <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </Select>

          <div>
            <Button variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="No accounts" message="No accounts match your filters." icon={CreditCard} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Account Name</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3 hidden md:table-cell">Provider</th>
                    <th className="text-left p-3">Card</th>
                    <th className="text-left p-3 hidden lg:table-cell">Currency</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium flex items-center gap-2">
                        {a.account_type === 'WALLET'
                          ? <Wallet size={16} className="text-slate-400" />
                          : <CreditCard size={16} className="text-slate-400" />}
                        {a.account_name}
                      </td>
                      <td className="p-3">{a.account_type}</td>
                      <td className="p-3 hidden md:table-cell">{a.provider_name || '-'}</td>
                      <td className="p-3 font-mono text-xs">{a.masked_number}</td>
                      <td className="p-3 hidden lg:table-cell">{a.currency}</td>
                      <td className="p-3"><Badge tone={a.status}>{a.status}</Badge></td>
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