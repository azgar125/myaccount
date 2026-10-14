import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import api from '../../services/api';
import { clientService } from '../../services/clientService';

const userService = {
  list: (params = {}) => api.get('/users', { params }).then((r) => r.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/users/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};

const schema = z.object({
  name:      z.string().min(1).max(150),
  email:     z.string().email(),
  password:  z.string().min(8).max(100).optional().or(z.literal('')),
  role:      z.enum(['ADMIN', 'CLIENT']),
  status:    z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  client_id: z.union([z.coerce.number().int().positive(), z.literal('')]).optional(),
});

export default function Users() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CLIENT', status: 'ACTIVE', client_id: '' },
  });

  const watchRole = watch('role');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.list({
        page, per_page: perPage,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      });
      setItems(res.data.items || []);
      setMeta(res.data.meta || null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, role, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    clientService.list({ per_page: 100 }).then((r) => setClients(r.data.items || []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ role: 'CLIENT', status: 'ACTIVE', client_id: '', name: '', email: '', password: '' });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    reset({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
      client_id: user.client_id || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = { ...values };
      if (!payload.password) delete payload.password;
      if (payload.role === 'ADMIN') payload.client_id = null;
      if (payload.client_id === '') payload.client_id = null;

      if (editing) {
        await userService.update(editing.id, payload);
        toast.success('User updated');
      } else {
        await userService.create(payload);
        toast.success('User created');
      }
      setModalOpen(false);
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
      await userService.remove(confirmDel.id);
      toast.success('User deleted');
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
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
          <Input label="Search" icon={Search} placeholder="Name, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Select label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="CLIENT">Client</option>
          </Select>
          <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
          <div className="flex gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button>
            <Button icon={Plus} onClick={openCreate}>Add User</Button>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3 hidden md:table-cell">Client</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3 hidden lg:table-cell">Last Login</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3"><Badge tone={u.role}>{u.role}</Badge></td>
                      <td className="p-3 hidden md:table-cell text-xs">{u.client?.name || '-'}</td>
                      <td className="p-3"><Badge tone={u.status}>{u.status}</Badge></td>
                      <td className="p-3 hidden lg:table-cell text-xs text-slate-500">{u.last_login_at || 'Never'}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setConfirmDel(u)} className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Name" required {...register('name')} error={errors.name?.message} />
          <Input label="Email" type="email" required {...register('email')} error={errors.email?.message} />

          <Input
            label={editing ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            required={!editing}
            {...register('password')}
            error={errors.password?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Role" {...register('role')} error={errors.role?.message}>
              <option value="ADMIN">Admin</option>
              <option value="CLIENT">Client</option>
            </Select>
            <Select label="Status" {...register('status')} error={errors.status?.message}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
          </div>

          {watchRole === 'CLIENT' && (
            <Select label="Linked Client" required {...register('client_id')} error={errors.client_id?.message}>
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
              ))}
            </Select>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Delete "${confirmDel?.name}"?`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}