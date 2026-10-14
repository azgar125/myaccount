import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const logService = {
  list: (params = {}) => api.get('/activity-logs', { params }).then((r) => r.data),
  get: (id) => api.get(`/activity-logs/${id}`).then((r) => r.data),
};

const actionTone = {
  CREATE: 'success', UPDATE: 'warning', DELETE: 'danger',
  LOGIN: 'info', LOGOUT: 'default', SETTINGS_CHANGE: 'primary',
};

export default function ActivityLogs() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filtersMeta, setFiltersMeta] = useState({ modules: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logService.list({
        page, per_page: perPage,
        search: search || undefined,
        module: module || undefined,
        action: action || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setItems(res.data.items || []);
      setMeta(res.data.meta || null);
      setFiltersMeta(res.data.filters || { modules: [], actions: [] });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, module, action, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Input label="Search" icon={Search} placeholder="User, record, IP..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

          <Select label="Module" value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }}>
            <option value="">All Modules</option>
            {filtersMeta.modules.map((m) => (<option key={m} value={m}>{m}</option>))}
          </Select>

          <Select label="Action" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {filtersMeta.actions.map((a) => (<option key={a} value={a}>{a}</option>))}
          </Select>

          <Input label="From" type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />

          <Input label="To" type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />

          <div className="flex items-end">
            <Button variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="No activity logs" message="Try changing filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Time</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Action</th>
                    <th className="text-left p-3">Module</th>
                    <th className="text-left p-3 hidden md:table-cell">Record</th>
                    <th className="text-left p-3 hidden lg:table-cell">IP</th>
                    <th className="text-right p-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 whitespace-nowrap text-xs">{log.created_at}</td>
                      <td className="p-3">{log.user_name || '-'}</td>
                      <td className="p-3"><Badge tone={actionTone[log.action] || 'default'}>{log.action}</Badge></td>
                      <td className="p-3">{log.module}</td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs">{log.record_id || '-'}</td>
                      <td className="p-3 hidden lg:table-cell text-xs text-slate-500">{log.ip_address || '-'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => setDetail(log)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                          <Eye size={16} />
                        </button>
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

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Activity Log Details" size="lg">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="User" value={detail.user_name} />
              <Field label="Action" value={detail.action} />
              <Field label="Module" value={detail.module} />
              <Field label="Record ID" value={detail.record_id} />
              <Field label="IP Address" value={detail.ip_address} />
              <Field label="Time" value={detail.created_at} />
            </div>

            {detail.old_value && (
              <div>
                <div className="text-xs uppercase text-slate-500 mb-1">Old Value</div>
                <pre className="bg-slate-50 p-3 rounded text-xs overflow-x-auto">{JSON.stringify(detail.old_value, null, 2)}</pre>
              </div>
            )}
            {detail.new_value && (
              <div>
                <div className="text-xs uppercase text-slate-500 mb-1">New Value</div>
                <pre className="bg-slate-50 p-3 rounded text-xs overflow-x-auto">{JSON.stringify(detail.new_value, null, 2)}</pre>
              </div>
            )}
            {detail.user_agent && (
              <div>
                <div className="text-xs uppercase text-slate-500 mb-1">User Agent</div>
                <div className="text-xs text-slate-600 break-all">{detail.user_agent}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-slate-800 mt-0.5">{value || '-'}</div>
    </div>
  );
}