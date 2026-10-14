import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import AccountForm from '../../components/forms/AccountForm';
import { clientService } from '../../services/clientService';
import { accountService } from '../../services/accountService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Account modal
  const [accModal, setAccModal]       = useState(false);
  const [editingAcc, setEditingAcc]   = useState(null);
  const [submittingAcc, setSubmittingAcc] = useState(false);

  // Delete account
  const [confirmAcc, setConfirmAcc]   = useState(null);
  const [deletingAcc, setDeletingAcc] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await clientService.get(id);
      setClient(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Client not found');
      navigate('/admin/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleAccountSubmit = async (payload) => {
    setSubmittingAcc(true);
    try {
      if (editingAcc) {
        await accountService.update(editingAcc.id, payload);
        toast.success('Account updated');
      } else {
        await accountService.create(payload);
        toast.success('Account created');
      }
      setAccModal(false);
      setEditingAcc(null);
      load();
    } catch (e) {
      const errs = e.response?.data?.errors;
      const first = errs ? Object.values(errs)[0]?.[0] : null;
      toast.error(first || e.response?.data?.message || 'Failed');
    } finally {
      setSubmittingAcc(false);
    }
  };

  const handleAccountDelete = async () => {
    if (!confirmAcc) return;
    setDeletingAcc(true);
    try {
      await accountService.remove(confirmAcc.id);
      toast.success('Account deleted');
      setConfirmAcc(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setDeletingAcc(false);
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;
  }
  if (!client) return null;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <button
          onClick={() => navigate('/admin/clients')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Back to Clients
        </button>
      </div>

      {/* Client card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
            {client.name?.[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
              <Badge tone={client.status}>{client.status}</Badge>
              <span className="text-sm font-mono text-slate-500">{client.client_code}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">
              <Info label="Phone"   value={client.phone} />
              <Info label="Email"   value={client.email} />
              <Info label="Country" value={client.country} />
              <Info label="Created" value={client.created_at} />
            </div>

            {client.address && (
              <div className="mt-3 text-sm">
                <span className="text-slate-500">Address: </span>
                <span className="text-slate-800">{client.address}</span>
              </div>
            )}
            {client.notes && (
              <div className="mt-2 text-sm text-slate-600">
                <span className="text-slate-500">Notes: </span>{client.notes}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Accounts */}
      <Card padding={false}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Accounts / Cards"
            subtitle={`${client.accounts?.length || 0} total`}
            action={
              <Button size="sm" icon={Plus} onClick={() => { setEditingAcc(null); setAccModal(true); }}>
                Add Account
              </Button>
            }
          />
        </div>

        {!client.accounts || client.accounts.length === 0 ? (
          <EmptyState title="No accounts" message="Add the first account for this client."
            action={<Button size="sm" icon={Plus} onClick={() => { setEditingAcc(null); setAccModal(true); }}>Add Account</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Provider</th>
                  <th className="text-left p-3">Card</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {client.accounts.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-medium">{a.account_name}</td>
                    <td className="p-3">{a.account_type}</td>
                    <td className="p-3">{a.provider_name || '-'}</td>
                    <td className="p-3 font-mono text-xs">{a.masked_number}</td>
                    <td className="p-3"><Badge tone={a.status}>{a.status}</Badge></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditingAcc(a); setAccModal(true); }} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setConfirmAcc(a)} className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div>
        <Link to={`/admin/transactions?client_id=${client.id}`} className="btn-primary inline-flex">
          View Client Transactions
        </Link>
      </div>

      <Modal
        open={accModal}
        onClose={() => { setAccModal(false); setEditingAcc(null); }}
        title={editingAcc ? 'Edit Account' : 'Add Account'}
      >
        <AccountForm
          clientId={client.id}
          initialValues={editingAcc}
          onSubmit={handleAccountSubmit}
          onCancel={() => { setAccModal(false); setEditingAcc(null); }}
          submitting={submittingAcc}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmAcc}
        onClose={() => setConfirmAcc(null)}
        onConfirm={handleAccountDelete}
        title="Delete Account"
        message={`Delete "${confirmAcc?.account_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deletingAcc}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-slate-800 mt-0.5">{value || '-'}</div>
    </div>
  );
}