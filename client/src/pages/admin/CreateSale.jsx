import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import SaleForm from '../../components/forms/SaleForm';
import { clientService } from '../../services/clientService';
import { transactionService } from '../../services/transactionService';

export default function CreateSale() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clientService.list({ per_page: 100, status: 'ACTIVE' }).then((r) => {
      setClients(r.data.items || []);
    });
  }, []);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const res = await transactionService.create(payload);
      toast.success('Sale created');
      navigate(`/admin/transactions/${res.data.id}`);
    } catch (e) {
      const errs = e.response?.data?.errors;
      const first = errs ? Object.values(errs)[0]?.[0] : null;
      toast.error(first || e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <button
        onClick={() => navigate('/admin/transactions')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Back to Transactions
      </button>

      <Card className="max-w-3xl">
        <CardHeader
          title="New Sale to Buyer"
          subtitle="Create a sale entry."
        />
        <SaleForm
          clients={clients}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/transactions')}
          submitting={submitting}
        />
      </Card>
    </div>
  );
}