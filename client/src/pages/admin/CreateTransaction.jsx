import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { clientService } from '../../services/clientService';
import { transactionService } from '../../services/transactionService';
import { calculateTransaction } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatCurrency';
import { todayISO } from '../../utils/dateUtils';

const schema = z.object({
  client_id:          z.coerce.number().int().positive('Client required'),
  account_id:         z.coerce.number().int().positive().optional().or(z.literal('')),
  transaction_type:   z.enum(['RECEIVE', 'PAYMENT', 'TRANSFER', 'ADJUSTMENT']).default('RECEIVE'),
  transaction_date:   z.string().min(1, 'Date required'),
  transaction_time:   z.string().min(1, 'Time required'),
  amount:             z.coerce.number().positive('Amount must be positive'),
  receive_percentage: z.coerce.number().min(0).max(100),
  payment_percentage: z.coerce.number().min(0).max(100),
  status:             z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED']).default('COMPLETED'),
  reference:          z.string().max(120).optional().or(z.literal('')),
  notes:              z.string().optional().or(z.literal('')),
});

export default function CreateTransaction() {
  const navigate = useNavigate();

  const [clients, setClients]   = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: '',
      account_id: '',
      transaction_type: 'RECEIVE',
      transaction_date: todayISO(),
      transaction_time: defaultTime,
      amount: 1000,
      receive_percentage: 84,
      payment_percentage: 87,
      status: 'COMPLETED',
      reference: '',
      notes: '',
    },
  });

  const clientId = watch('client_id');
  const amount   = watch('amount');
  const rp       = watch('receive_percentage');
  const pp       = watch('payment_percentage');

  const preview = useMemo(() => {
    return calculateTransaction({
      amount,
      receivePercentage: rp,
      paymentPercentage: pp,
      mode: 'PAYMENT_MINUS_RECEIVE',
    });
  }, [amount, rp, pp]);

  useEffect(() => {
    clientService.list({ per_page: 100, status: 'ACTIVE' }).then((r) => {
      setClients(r.data.items || []);
    });
  }, []);

  useEffect(() => {
    if (!clientId) { setAccounts([]); return; }
    const c = clients.find((x) => String(x.id) === String(clientId));
    setAccounts(c?.accounts || []);
  }, [clientId, clients]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        client_id:          Number(values.client_id),
        account_id:         values.account_id ? Number(values.account_id) : null,
        transaction_type:   values.transaction_type,
        transaction_date:   values.transaction_date,
        transaction_time:   values.transaction_time,
        amount:             Number(values.amount),
        receive_percentage: Number(values.receive_percentage),
        payment_percentage: Number(values.payment_percentage),
        status:             values.status,
        reference:          values.reference || null,
        notes:              values.notes || null,
      };

      const res = await transactionService.create(payload);
      toast.success('Transaction created');
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
      <button onClick={() => navigate('/admin/transactions')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Back to Transactions
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-4" noValidate>
        {/* Form */}
        <Card className="lg:col-span-2">
          <CardHeader title="Transaction Details" />

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Client" required {...register('client_id')} error={errors.client_id?.message}>
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.client_code} — {c.name}</option>
                ))}
              </Select>

              <Select label="Account" {...register('account_id')} error={errors.account_id?.message}>
                <option value="">No account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name} ({a.masked_number})</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Type" {...register('transaction_type')} error={errors.transaction_type?.message}>
                <option value="RECEIVE">Receive</option>
                <option value="PAYMENT">Payment</option>
                <option value="TRANSFER">Transfer</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </Select>
              <Input label="Date" type="date" required {...register('transaction_date')} error={errors.transaction_date?.message} />
              <Input label="Time" type="time" required {...register('transaction_time')} error={errors.transaction_time?.message} />
            </div>

            <Input label="Amount" type="number" step="0.01" required
              {...register('amount')} error={errors.amount?.message} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Receive %" type="number" step="0.01" min="0" max="100" required
                {...register('receive_percentage')} error={errors.receive_percentage?.message} />
              <Input label="Payment %" type="number" step="0.01" min="0" max="100" required
                {...register('payment_percentage')} error={errors.payment_percentage?.message} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Status" {...register('status')} error={errors.status?.message}>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="FAILED">Failed</option>
              </Select>
              <Input label="Reference" {...register('reference')} error={errors.reference?.message} placeholder="Optional" />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea className="input min-h-[80px] resize-y" {...register('notes')} />
            </div>
          </div>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader title="Live Preview" subtitle="Backend will recompute before saving" />

          <div className="space-y-3">
            <Row label="Amount"          value={formatCurrency(preview.amount)} />
            <Row label="Receive Amount"  value={formatCurrency(preview.receiveAmount)}  tone="text-primary-700" />
            <Row label="Payment Amount"  value={formatCurrency(preview.paymentAmount)}  tone="text-warning-700" />

            <div className="border-t pt-3">
              <Row label="Profit"
                value={formatCurrency(preview.profit)}
                tone={preview.profit >= 0 ? 'text-success-700' : 'text-danger-700'}
                bold
              />
            </div>
          </div>

          <Button type="submit" icon={Save} loading={submitting} fullWidth className="mt-5">
            Save Transaction
          </Button>
        </Card>
      </form>
    </div>
  );
}

function Row({ label, value, tone = 'text-slate-900', bold = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-base' : 'font-medium'} ${tone}`}>{value}</span>
    </div>
  );
}