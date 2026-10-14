import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const schema = z.object({
  name:    z.string().min(1, 'Name is required').max(150),
  phone:   z.string().max(40).optional().or(z.literal('')),
  email:   z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  country: z.string().max(80).optional().or(z.literal('')),
  status:  z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  notes:   z.string().optional().or(z.literal('')),
});

export default function ClientForm({ initialValues = null, onSubmit, onCancel, submitting = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      name: '', phone: '', email: '', address: '', country: '',
      status: 'ACTIVE', notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate id="client-form">
      <Input label="Full Name" required {...register('name')} error={errors.name?.message} placeholder="e.g. FOYSAL" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Phone" {...register('phone')} error={errors.phone?.message} placeholder="+880 17..." />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} placeholder="client@example.com" />
      </div>

      <Input label="Address" {...register('address')} error={errors.address?.message} placeholder="Mirpur, Dhaka" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Country" {...register('country')} error={errors.country?.message} placeholder="Bangladesh" />
        <Select label="Status" {...register('status')} error={errors.status?.message}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          className="input min-h-[80px] resize-y"
          placeholder="Optional notes..."
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>
          {initialValues ? 'Update' : 'Create'} Client
        </Button>
      </div>
    </form>
  );
}