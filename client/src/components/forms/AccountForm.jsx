import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const schema = z.object({
  account_type:  z.string().min(1).max(40).default('CARD'),
  account_name:  z.string().min(1, 'Account name required').max(120),
  provider_name: z.string().max(120).optional().or(z.literal('')),
  card_number:   z.string().max(32).optional().or(z.literal('')),
  currency:      z.string().length(3).default('USD'),
  status:        z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).default('ACTIVE'),
  notes:         z.string().optional().or(z.literal('')),
});

export default function AccountForm({ clientId, initialValues = null, onSubmit, onCancel, submitting = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      account_type: 'CARD', account_name: '', provider_name: '',
      card_number: '', currency: 'USD', status: 'ACTIVE', notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => onSubmit({ ...v, client_id: clientId }))} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Account Type" {...register('account_type')} error={errors.account_type?.message}>
          <option value="CARD">Card</option>
          <option value="WALLET">Wallet</option>
          <option value="BANK">Bank</option>
          <option value="OTHER">Other</option>
        </Select>
        <Select label="Currency" {...register('currency')} error={errors.currency?.message}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="BDT">BDT</option>
        </Select>
      </div>

      <Input label="Account Name" required {...register('account_name')} error={errors.account_name?.message} placeholder="e.g. Primary Card" />
      <Input label="Provider / Bank" {...register('provider_name')} error={errors.provider_name?.message} placeholder="e.g. Visa, PayPal, DBBL" />

      <Input
        label="Card / Account Number"
        {...register('card_number')}
        error={errors.card_number?.message}
        placeholder="4111 1111 1111 1111"
        helper="Will be masked. Full number never shown in UI."
      />

      <Select label="Status" {...register('status')} error={errors.status?.message}>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="BLOCKED">Blocked</option>
      </Select>

      <div>
        <label className="label">Notes</label>
        <textarea className="input min-h-[70px] resize-y" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>
          {initialValues ? 'Update' : 'Create'} Account
        </Button>
      </div>
    </form>
  );
}