import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Globe, CreditCard, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { clientPortalService } from '../../services/clientPortalService';

export default function Profile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await clientPortalService.profile();
        setData(res.data);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;
  if (!data?.client) return null;

  const c = data.client;
  const accounts = data.accounts || [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {c.name?.[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{c.name}</h1>
              <Badge tone={c.status}>{c.status}</Badge>
            </div>
            <div className="text-sm font-mono text-slate-500 mt-1">{c.client_code}</div>
            {c.notes && <p className="text-sm text-slate-600 mt-3">{c.notes}</p>}
          </div>
        </div>
      </Card>

      {/* Contact info */}
      <Card>
        <CardHeader title="Contact Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoRow icon={Phone} label="Phone"   value={c.phone} />
          <InfoRow icon={Mail}  label="Email"   value={c.email} />
          <InfoRow icon={MapPin} label="Address" value={c.address} />
          <InfoRow icon={Globe} label="Country" value={c.country} />
        </div>
      </Card>

      {/* Accounts preview */}
      <Card padding={false}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="My Accounts"
            subtitle={`${accounts.length} total`}
          />
        </div>

        {accounts.length === 0 ? (
          <EmptyState title="No accounts yet" message="Your accounts will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3 hidden md:table-cell">Provider</th>
                  <th className="text-left p-3">Card</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 font-medium flex items-center gap-2">
                      {a.account_type === 'WALLET' ? <Wallet size={16} className="text-slate-400" /> : <CreditCard size={16} className="text-slate-400" />}
                      {a.account_name}
                    </td>
                    <td className="p-3">{a.account_type}</td>
                    <td className="p-3 hidden md:table-cell">{a.provider_name || '-'}</td>
                    <td className="p-3 font-mono text-xs">{a.masked_number}</td>
                    <td className="p-3"><Badge tone={a.status}>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500 uppercase">{label}</div>
        <div className="text-slate-800 mt-0.5 truncate">{value || '-'}</div>
      </div>
    </div>
  );
}