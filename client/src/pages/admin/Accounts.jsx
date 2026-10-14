import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import AccountForm from '../../components/forms/AccountForm';
import { accountService } from '../../services/accountService';
import { clientService } from '../../services/clientService';

export default function Accounts() {
  const [items, setItems] = useState([]);
  const [meta, setMeta]   = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [search, setSearch]     = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus]     = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountService.list({
        page, per_page: perPage,
        search: search || undefined,
        client_id: clientId || undefined,
        status: status || undefined,
      });
      setItems(res.data.items || []);
      setMeta(res.data.meta || null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, clientId, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    clientService.list({ per_page: 100 }).then((r) => {
      setClients(r.data.items || []);
    }).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (acc) => { setEditing(acc); setModalOpen(true); };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await accountService.update(editing.id, payload);
        toast.success('Account updated');
      } else {
        await accountService.create(payload);
        toast.success('Account created');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      const errs = e.response?.data?.errors;
      const first = errs ? Object.values(errs)[0]?.[0] : null;
      toast.error(first || e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await accountService.remove(confirmDel.id);
      toast.success('Account deleted');
      setConfirmDel(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
          <Input label="Search" icon={Search} placeholder="Name, provider, last4..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

          <Select label="Client" value={clientId}
            onChange={(e) => { setClientId(e.target.value); setPage(1); }}>
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
            ))}
          </Select>

          <Select label="Status" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </Select>

          <div className="flex gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button>
            <Button icon={Plus} onClick={openCreate} fullWidth>Add Account</Button>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="No accounts" message="Add the first account." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Client</th>
                    <th className="text-left p-3">Account Name</th>
                    <th className="text-left p-3 hidden md:table-cell">Provider</th>
                    <th className="text-left p-3">Card</th>
                    <th className="text-left p-3 hidden lg:table-cell">Currency</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="border-t hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-medium">{a.client?.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{a.client?.client_code}</div>
                      </td>
                      <td className="p-3">{a.account_name}</td>
                      <td className="p-3 hidden md:table-cell">{a.provider_name || '-'}</td>
                      <td className="p-3 font-mono text-xs">{a.masked_number}</td>
                      <td className="p-3 hidden lg:table-cell">{a.currency}</td>
                      <td className="p-3"><Badge tone={a.status}>{a.status}</Badge></td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setConfirmDel(a)} className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50">
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

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Account' : 'Add Account'}
      >
        <AccountForm
          clientId={editing?.client_id}
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        message={`Delete "${confirmDel?.account_name}"?`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}