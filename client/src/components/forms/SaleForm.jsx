import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { calculateTransaction } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatCurrency';
import { todayISO } from '../../utils/dateUtils';

const schema = z.object({
  client_id:        z.coerce.number().int().positive('Buyer required'),
  account_id:       z.union([z.coerce.number().int().positive(), z.literal('')]).optional(),
  transaction_date: z.string().min(1, 'Date required'),
  transaction_time: z.string().min(1, 'Time required'),
  amount_usd:       z.coerce.number().positive('Amount required'),
  purchase_usd:     z.coerce.number().positive('Purchase required'),
  percentage:       z.coerce.number().min(0).max(100),
  reference:        z.string().max(120).optional().or(z.literal('')),
  notes:            z.string().optional().or(z.literal('')),
});

export default function SaleForm({
  clients = [],
  initialValues = null,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      client_id: '',
      account_id: '',
      transaction_date: todayISO(),
      transaction_time: defaultTime,
      amount_usd: 1661,
      purchase_usd: 1655,
      percentage: 87,
      reference: '',
      notes: '',
    },
  });

  const clientId   = watch('client_id');
  const amount     = watch('amount_usd');
  const purchase   = watch('purchase_usd');
  const percentage = watch('percentage');

  const selectedClient = clients.find((c) => String(c.id) === String(clientId));
  const accounts = selectedClient?.accounts || [];

  const preview = useMemo(
    () => calculateTransaction({ amountUsd: amount, purchaseUsd: purchase, percentage }),
    [amount, purchase, percentage]
  );

  const submit = (values) => {
    onSubmit({
      type: 'SALE',
      client_id:        Number(values.client_id),
      account_id:       values.account_id ? Number(values.account_id) : null,
      transaction_date: values.transaction_date,
      transaction_time: values.transaction_time,
      amount_usd:       Number(values.amount_usd),
      purchase_usd:     Number(values.purchase_usd),
      percentage:       Number(values.percentage),
      reference:        values.reference || null,
      notes:            values.notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Buyer" required {...register('client_id')} error={errors.client_id?.message}>
          <option value="">Select buyer...</option>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Date" type="date" required {...register('transaction_date')} error={errors.transaction_date?.message} />
        <Input label="Time" type="time" required {...register('transaction_time')} error={errors.transaction_time?.message} />
      </div>

      <Input label="Amount (USD)" type="number" step="0.01" required
        {...register('amount_usd')} error={errors.amount_usd?.message} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Purchase (USD)" type="number" step="0.01" required
          {...register('purchase_usd')} error={errors.purchase_usd?.message} />
        <Input label="Percentage (%)" type="number" step="0.01" min="0" max="100" required
          {...register('percentage')} error={errors.percentage?.message}
          helper="e.g. 87 means 87%" />
      </div>

      <Input label="Reference" {...register('reference')} error={errors.reference?.message} placeholder="Optional" />

      <div>
        <label className="label">Notes</label>
        <textarea className="input min-h-[70px] resize-y" {...register('notes')} />
      </div>

      {/* Preview */}
      <div className="rounded-lg bg-green-50 border border-green-100 p-4 space-y-2 text-sm">
        <div className="text-xs uppercase text-green-700 font-medium mb-1">Live Preview</div>
        <Row label="Purchase" value={formatCurrency(preview.purchaseUsd)} />
        <Row label={`Percentage (${preview.percentage}%)`} value={formatCurrency(preview.percentageAmount)} />
        <div className="border-t border-green-200 pt-2">
          <Row label="Buyer Receivable" value={formatCurrency(preview.totalPayable)} bold />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting} variant="success">Save Sale</Button>
      </div>
    </form>
  );
}

function Row({ label, value, bold = false }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`${bold ? 'font-bold text-base' : 'font-medium'} text-slate-900`}>{value}</span>
    </div>
  );
}