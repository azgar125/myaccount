import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { calculatePartialSaleProfit } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatCurrency';
import { todayISO } from '../../utils/dateUtils';

const schema = z.object({
  sold_quantity:   z.coerce.number().positive('Sold quantity required'),
  sale_percentage: z.coerce.number().min(0).max(100),
  sale_date:       z.string().min(1, 'Date required'),
  notes:           z.string().optional().or(z.literal('')),
});

export default function PartialSaleModal({ open, onClose, parent, onSubmit, submitting }) {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      sold_quantity: '',
      sale_percentage: parent?.percentage ? Number(parent.percentage) : 87,
      sale_date: todayISO(),
      notes: '',
    },
  });

  const soldQty = watch('sold_quantity');
  const salePct = watch('sale_percentage');

  const preview = useMemo(() => {
    if (!parent || !soldQty) return null;
    return calculatePartialSaleProfit({
      soldQuantity: Number(soldQty),
      purchasePercentage: Number(parent.percentage),
      salePercentage: Number(salePct),
    });
  }, [parent, soldQty, salePct]);

  const submit = (values) => {
    onSubmit({
      sold_quantity: Number(values.sold_quantity),
      sale_percentage: Number(values.sale_percentage),
      sale_date: values.sale_date,
      notes: values.notes || null,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!parent) return null;

  const remaining = Number(parent.remaining_quantity || 0);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Add Sale against ${parent.transaction_no}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-lg">
          <InfoRow label="Seller" value={parent.client?.name} />
          <InfoRow label="Purchase" value={formatCurrency(parent.purchase_usd)} />
          <InfoRow label="Seller %" value={`${parent.percentage}%`} />
          <InfoRow label="Remaining" value={formatCurrency(remaining)} accent />
        </div>

        <Input
          label="Sold Quantity (USD)"
          type="number" step="0.01" required
          {...register('sold_quantity')}
          error={errors.sold_quantity?.message}
          helper={`Max: ${formatCurrency(remaining)}`}
        />

        <Input
          label="Sale Percentage (%)"
          type="number" step="0.01" min="0" max="100" required
          {...register('sale_percentage')}
          error={errors.sale_percentage?.message}
          helper="Different from purchase % gives profit"
        />

        <Input label="Sale Date" type="date" required
          {...register('sale_date')} error={errors.sale_date?.message} />

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[60px] resize-y" {...register('notes')} />
        </div>

        {preview && (
          <div className="rounded-lg bg-green-50 border border-green-100 p-4 space-y-2 text-sm">
            <div className="text-xs uppercase text-green-700 font-medium mb-1">Profit Preview</div>
            <Row label="Cost of Goods" value={formatCurrency(preview.costOfGoods)} />
            <Row label="Sale Amount" value={formatCurrency(preview.saleAmount)} />
            <div className="border-t border-green-200 pt-2">
              <Row
                label="Realized Profit"
                value={formatCurrency(preview.profitRealized)}
                tone={preview.profitRealized >= 0 ? 'text-success-700' : 'text-danger-700'}
                bold
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="success" loading={submitting}>Save Sale</Button>
        </div>
      </form>
    </Modal>
  );
}

function InfoRow({ label, value, accent = false }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-medium ${accent ? 'text-primary-700' : 'text-slate-800'}`}>{value || '-'}</div>
    </div>
  );
}

function Row({ label, value, tone = 'text-slate-900', bold = false }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`${bold ? 'font-bold text-base' : 'font-medium'} ${tone}`}>{value}</span>
    </div>
  );
}