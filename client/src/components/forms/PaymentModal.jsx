import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { todayISO } from '../../utils/dateUtils';

const schema = z.object({
  amount_usd:   z.coerce.number().positive('Amount required'),
  payment_date: z.string().min(1, 'Date required'),
  method:       z.string().max(60).optional().or(z.literal('')),
  reference:    z.string().max(120).optional().or(z.literal('')),
  notes:        z.string().optional().or(z.literal('')),
});

export default function PaymentModal({ open, onClose, transaction, onSubmit, submitting }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount_usd: '',
      payment_date: todayISO(),
      method: 'Cash',
      reference: '',
      notes: '',
    },
  });

  const submit = (values) => {
    onSubmit({
      amount_usd:   Number(values.amount_usd),
      payment_date: values.payment_date,
      method:       values.method || null,
      reference:    values.reference || null,
      notes:        values.notes || null,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!transaction) return null;

  const isPurchase = transaction.type === 'PURCHASE';
  const dueAmount = Number(transaction.due_amount || 0);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isPurchase ? 'Record Payment to Seller' : 'Record Receipt from Buyer'}
      size="md"
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-lg">
          <InfoRow label="Transaction" value={transaction.transaction_no} />
          <InfoRow label="Party" value={transaction.client?.name} />
          <InfoRow label="Total Payable" value={formatCurrency(transaction.total_payable)} />
          <InfoRow label="Due" value={formatCurrency(dueAmount)} accent />
        </div>

        <Input
          label="Amount (USD)"
          type="number" step="0.01" min="0.01" required
          {...register('amount_usd')}
          error={errors.amount_usd?.message}
          helper={`Max due: ${formatCurrency(dueAmount)}`}
        />

        <Input label="Payment Date" type="date" required
          {...register('payment_date')} error={errors.payment_date?.message} />

        <Select label="Method" {...register('method')} error={errors.method?.message}>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Mobile Wallet">Mobile Wallet</option>
          <option value="Cheque">Cheque</option>
          <option value="Other">Other</option>
        </Select>

        <Input label="Reference" {...register('reference')} error={errors.reference?.message} placeholder="Optional" />

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[60px] resize-y" {...register('notes')} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {isPurchase ? 'Record Payment' : 'Record Receipt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function InfoRow({ label, value, accent = false }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-medium ${accent ? 'text-danger-700' : 'text-slate-800'}`}>{value || '-'}</div>
    </div>
  );
}