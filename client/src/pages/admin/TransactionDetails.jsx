import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import PartialSaleModal from '../../components/forms/PartialSaleModal';
import PaymentModal from '../../components/forms/PaymentModal';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [t, setT] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPartial, setShowPartial] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await transactionService.get(id);
      setT(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Not found');
      navigate('/admin/transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handlePartialSale = async (payload) => {
    setSubmitting(true);
    try {
      await transactionService.addPartialSale(t.id, payload);
      toast.success('Partial sale added');
      setShowPartial(false);
      load();
    } catch (e) {
      const errs = e.response?.data?.errors;
      const first = errs ? Object.values(errs)[0]?.[0] : null;
      toast.error(first || e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (payload) => {
    setSubmitting(true);
    try {
      await transactionService.addPayment(t.id, payload);
      toast.success('Payment recorded');
      setShowPayment(false);
      load();
    } catch (e) {
      const errs = e.response?.data?.errors;
      const first = errs ? Object.values(errs)[0]?.[0] : null;
      toast.error(first || e.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Spinner size="lg" /></div>;
  if (!t) return null;

  // 🔑 SAFE checks — case-insensitive and null-safe
  const typeUpper    = String(t.type || '').toUpperCase();
  const isPurchase   = typeUpper === 'PURCHASE';
  const isSale       = typeUpper === 'SALE';
  const dueAmount    = Number(t.due_amount || 0);
  const remainingQty = Number(t.remaining_quantity || 0);

  // Only PURCHASE + having remaining quantity → can add partial sale
  const canAddPartialSale = isPurchase && remainingQty > 0;

  // Any transaction with due amount → can add payment
  const canAddPayment = dueAmount > 0;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <button onClick={() => navigate('/admin/transactions')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Back to Transactions
      </button>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 font-mono">{t.transaction_no}</h2>
              <Badge tone={isPurchase ? 'primary' : 'success'}>
                {isPurchase ? 'PURCHASE' : isSale ? 'SALE' : typeUpper}
              </Badge>
              <Badge tone={t.status}>{t.status}</Badge>
              <Badge tone={t.payment_status === 'PAID' ? 'success' : t.payment_status === 'PARTIAL' ? 'warning' : 'default'}>
                {t.payment_status}
              </Badge>
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {t.transaction_date} at {t.transaction_time}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Only show Partial Sale button for PURCHASE with remaining */}
            {canAddPartialSale && (
              <Button icon={Plus} onClick={() => setShowPartial(true)}>
                Add Partial Sale
              </Button>
            )}

            {/* Only show Payment button when due exists */}
            {canAddPayment && (
              <Button variant="secondary" icon={Wallet} onClick={() => setShowPayment(true)}>
                {isPurchase ? 'Record Payment' : 'Record Receipt'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Party + Meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader title={isPurchase ? 'Seller' : 'Buyer'} />
          <div className="space-y-2 text-sm">
            <Field label="Name" value={t.client?.name} />
            <Field label="Code" value={t.client?.client_code} mono />
            <Field label="Account" value={t.account?.masked_number} mono />
          </div>
        </Card>

        <Card>
          <CardHeader title="Transaction" />
          <div className="space-y-2 text-sm">
            <Field label="Amount" value={formatCurrency(t.amount_usd)} />
            <Field label="Purchase" value={formatCurrency(t.purchase_usd)} />
            <Field label="Percentage" value={`${t.percentage}%`} />
            <Field label="Total Payable" value={formatCurrency(t.total_payable)} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Payment Summary" />
          <div className="space-y-2 text-sm">
            <Field label="Payable" value={formatCurrency(t.total_payable)} />
            <Field label="Paid" value={formatCurrency(t.paid_amount)} tone="text-success-700" />
            <Field
              label="Due"
              value={formatCurrency(dueAmount)}
              tone={dueAmount > 0 ? 'text-danger-700' : 'text-slate-500'}
            />
            <Field label="Reference" value={t.reference || '-'} />
          </div>
        </Card>
      </div>

      {/* ---- PURCHASE ONLY: Partial Sales Section ---- */}
      {isPurchase && (
        <Card padding={false}>
          <div className="p-4 sm:p-5">
            <CardHeader
              title="Partial Sales History"
              subtitle={`Sold: ${formatCurrency(t.sold_quantity)} / ${formatCurrency(t.purchase_usd)}`}
              action={
                canAddPartialSale && (
                  <Button size="sm" icon={Plus} onClick={() => setShowPartial(true)}>
                    Add Sale
                  </Button>
                )
              }
            />
          </div>

          {!t.partial_sales || t.partial_sales.length === 0 ? (
            <EmptyState
              title="No partial sales yet"
              message={`Remaining: ${formatCurrency(remainingQty)}`}
              action={
                canAddPartialSale && (
                  <Button size="sm" icon={Plus} onClick={() => setShowPartial(true)}>
                    Add First Sale
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-right p-3">Sold</th>
                    <th className="text-right p-3">Sale %</th>
                    <th className="text-right p-3">Sale Amount</th>
                    <th className="text-right p-3">Cost</th>
                    <th className="text-right p-3">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {t.partial_sales.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3">{s.sale_date}</td>
                      <td className="p-3 text-right">{formatCurrency(s.sold_quantity)}</td>
                      <td className="p-3 text-right text-slate-500">{s.sale_percentage}%</td>
                      <td className="p-3 text-right text-warning-700">{formatCurrency(s.sale_amount)}</td>
                      <td className="p-3 text-right text-primary-700">{formatCurrency(s.cost_of_goods)}</td>
                      <td className={`p-3 text-right font-medium ${Number(s.profit_realized) >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                        {formatCurrency(s.profit_realized)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold">
                  <tr className="border-t-2">
                    <td className="p-3" colSpan={5}>Total Realized Profit</td>
                    <td className="p-3 text-right text-success-700">
                      {formatCurrency(t.total_profit_realized)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ---- SALE ONLY: Info banner ---- */}
      {isSale && (
        <Card>
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <div className="h-8 w-8 rounded-full bg-success-50 text-success-600 flex items-center justify-center flex-shrink-0">
              <span className="font-bold">$</span>
            </div>
            <div>
              <div className="font-medium text-slate-800">This is a Sale transaction</div>
              <p className="mt-0.5">
                Partial sales are only available for Purchase transactions.
                Use <strong>Record Receipt</strong> to log payments received from the buyer.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ---- Payments ---- */}
      <Card padding={false}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title={isPurchase ? 'Payment History (Out)' : 'Receipt History (In)'}
            subtitle={`Total: ${formatCurrency(t.paid_amount)} / ${formatCurrency(t.total_payable)}`}
            action={
              canAddPayment && (
                <Button size="sm" icon={Wallet} onClick={() => setShowPayment(true)}>
                  {isPurchase ? 'Add Payment' : 'Add Receipt'}
                </Button>
              )
            }
          />
        </div>

        {!t.payments || t.payments.length === 0 ? (
          <EmptyState title="No payments yet" message={`Due: ${formatCurrency(dueAmount)}`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-left p-3 hidden md:table-cell">Reference</th>
                  <th className="text-right p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {t.payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">{p.payment_date}</td>
                    <td className="p-3">{p.method || '-'}</td>
                    <td className="p-3 hidden md:table-cell text-xs">{p.reference || '-'}</td>
                    <td className="p-3 text-right font-medium text-success-700">
                      {formatCurrency(p.amount_usd)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold">
                <tr className="border-t-2">
                  <td className="p-3" colSpan={3}>Total Paid</td>
                  <td className="p-3 text-right text-success-700">{formatCurrency(t.paid_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Notes */}
      {t.notes && (
        <Card>
          <CardHeader title="Notes" />
          <p className="text-sm text-slate-700 whitespace-pre-line">{t.notes}</p>
        </Card>
      )}

      {/* Modals */}
      <PartialSaleModal
        open={showPartial}
        onClose={() => setShowPartial(false)}
        parent={t}
        onSubmit={handlePartialSale}
        submitting={submitting}
      />
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        transaction={t}
        onSubmit={handlePayment}
        submitting={submitting}
      />
    </div>
  );
}

function Field({ label, value, mono = false, tone = 'text-slate-800' }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className={`mt-0.5 ${mono ? 'font-mono text-xs' : ''} ${tone}`}>{value || '-'}</div>
    </div>
  );
}