import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const settingsService = {
  get: () => api.get('/settings').then((r) => r.data),
  update: (payload) => api.put('/settings', payload).then((r) => r.data),
};

const schema = z.object({
  system_name: z.string().min(1).max(255),
  currency: z.string().length(3),
  date_format: z.string().min(1),
  timezone: z.string().min(1),
  default_receive_percentage: z.coerce.number().min(0).max(100),
  default_payment_percentage: z.coerce.number().min(0).max(100),
  profit_mode: z.enum(['PAYMENT_MINUS_RECEIVE', 'RECEIVE_MINUS_PAYMENT', 'PERCENTAGE_DIFFERENCE', 'FIXED_FEE', 'CUSTOM_COMMISSION']),
  fixed_fee: z.coerce.number().min(0),
  company_name: z.string().max(255).optional().or(z.literal('')),
  company_address: z.string().max(255).optional().or(z.literal('')),
  company_phone: z.string().max(255).optional().or(z.literal('')),
  company_email: z.string().email().optional().or(z.literal('')),
});

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await settingsService.get();
      reset(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const res = await settingsService.update(values);
      reset(res.data);
      toast.success('Settings saved');
    } catch (e) {
      const errs = e.response?.data?.errors;
      const first = errs ? Object.values(errs)[0]?.[0] : null;
      toast.error(first || e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* System */}
        <Card>
          <CardHeader title="System" subtitle="Basic settings for your accounting system" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="System Name" required {...register('system_name')} error={errors.system_name?.message} />
            <Select label="Currency" {...register('currency')} error={errors.currency?.message}>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Pound Sterling</option>
              <option value="BDT">BDT — Bangladeshi Taka</option>
              <option value="INR">INR — Indian Rupee</option>
            </Select>
            <Input label="Date Format" {...register('date_format')} error={errors.date_format?.message} placeholder="Y-m-d" />
            <Input label="Timezone" {...register('timezone')} error={errors.timezone?.message} placeholder="Asia/Dhaka" />
          </div>
        </Card>

        {/* Accounting */}
        <Card>
          <CardHeader
            title="Accounting Defaults"
            subtitle="These values are pre-filled when creating new transactions"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Default Receive %"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              {...register('default_receive_percentage')}
              error={errors.default_receive_percentage?.message}
              helper="Example: 84 means 84% of the amount"
            />
            <Input
              label="Default Payment %"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              {...register('default_payment_percentage')}
              error={errors.default_payment_percentage?.message}
              helper="Example: 87 means 87% of the amount"
            />
            <Select
              label="Profit Calculation Mode"
              required
              {...register('profit_mode')}
              error={errors.profit_mode?.message}
            >
              <option value="PAYMENT_MINUS_RECEIVE">Payment − Receive (default)</option>
              <option value="RECEIVE_MINUS_PAYMENT">Receive − Payment</option>
              <option value="PERCENTAGE_DIFFERENCE">Percentage Difference × Amount</option>
              <option value="FIXED_FEE">Fixed Fee</option>
              <option value="CUSTOM_COMMISSION">Custom Commission</option>
            </Select>
            <Input
              label="Fixed Fee"
              type="number"
              step="0.01"
              min="0"
              {...register('fixed_fee')}
              error={errors.fixed_fee?.message}
              helper="Used only when Profit Mode is FIXED_FEE"
            />
          </div>
        </Card>

        {/* Company */}
        <Card>
          <CardHeader title="Company Information" subtitle="Shown on printed reports and statements" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name" {...register('company_name')} error={errors.company_name?.message} />
            <Input label="Company Email" type="email" {...register('company_email')} error={errors.company_email?.message} />
            <Input label="Company Phone" {...register('company_phone')} error={errors.company_phone?.message} />
            <Input label="Company Address" {...register('company_address')} error={errors.company_address?.message} />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" icon={RefreshCw} onClick={load}>Reset</Button>
          <Button type="submit" icon={Save} loading={saving}>Save Settings</Button>
        </div>
      </form>
    </div>
  );
}