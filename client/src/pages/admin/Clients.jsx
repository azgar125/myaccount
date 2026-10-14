import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Eye, RefreshCw } from 'lucide-react';
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
import ClientForm from '../../components/forms/ClientForm';
import { clientService } from '../../services/clientService';

export default function Clients() {
  const [items, setItems]   = useState([]);
  const [meta, setMeta]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(25);
  const [page, setPage]     = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  // Delete confirm
  const [confirmDel, setConfirmDel]   = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientService.list({
        page, per_page: perPage,
        search: search || undefined,
        status: status || undefined,
      });
      setItems(res.data.items || []);
      setMeta(res.data.meta || null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, status]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (client) => { setEditing(client); setModalOpen(true); };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await clientService.update(editing.id, payload);
        toast.success('Client updated');
      } else {
        await clientService.create(payload);
        toast.success('Client created');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      const errs = e.response?.data?.errors;
      const first = errs ? Object.values(errs)[0]?.[0] : null;
      toast.error(first || e.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await clientService.remove(confirmDel.id);
      toast.success('Client deleted');
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
      {/* Toolbar */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Search"
              icon={Search}
              placeholder="Name, code, phone, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button>
            <Button icon={Plus} onClick={openCreate}>Add Client</Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No clients found"
            message="Try changing filters or add a new client."
            action={<Button icon={Plus} onClick={openCreate}>Add Client</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Code</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3 hidden md:table-cell">Phone</th>
                    <th className="text-left p-3 hidden lg:table-cell">Email</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{c.client_code}</td>
                      <td className="p-3 font-medium text-slate-800">{c.name}</td>
                      <td className="p-3 hidden md:table-cell">{c.phone || '-'}</td>
                      <td className="p-3 hidden lg:table-cell">{c.email || '-'}</td>
                      <td className="p-3"><Badge tone={c.status}>{c.status}</Badge></td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/clients/${c.id}`} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="View">
                            <Eye size={16} />
                          </Link>
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setConfirmDel(c)} className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50" title="Delete">
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

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Client — ${editing.client_code}` : 'Add New Client'}
        size="lg"
      >
        <ClientForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Delete "${confirmDel?.name}"? This will also affect related data.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}