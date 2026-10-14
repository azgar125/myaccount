import { useEffect, useState, useCallback } from 'react';
import { Download, Printer, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { clientPortalService } from '../../services/clientPortalService';
import { formatCurrency } from '../../utils/formatCurrency';
import { startOfMonthISO, todayISO } from '../../utils/dateUtils';
import { reportService, downloadBlob } from '../../services/reportService';

export default function Statements() {
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo]     = useState(todayISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientPortalService.statements({ from, to });
      setData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load statement');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      // Use the report service with downloadStatement helper
      //const { reportService, downloadBlob } = await import('../../services/reportService');
      const res = await reportService.downloadStatement({ from, to });
      downloadBlob(res, `statement-${from}-${to}.pdf`);
      toast.success('Statement downloaded');
    } catch (e) {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filters */}
      <Card className="print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <div className="flex gap-2">
            <Button onClick={load} variant="secondary" icon={RefreshCw}>
              Load
            </Button>
            <Button onClick={handleDownloadPdf} icon={Download} loading={downloading}>
              Download PDF
            </Button>
            <Button onClick={handlePrint} variant="ghost" icon={Printer}>
              Print
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="p-10 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : !data ? null : (
        <>
          {/* Statement header */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Account Statement</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Period: <span className="font-medium text-slate-700">{data.from}</span> →{' '}
                  <span className="font-medium text-slate-700">{data.to}</span>
                </p>
              </div>
              <div className="text-sm text-slate-500">
                Generated: {new Date().toLocaleString()}
              </div>
            </div>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Transactions" value={data.totals.total_transactions} />
            <SummaryCard
              label="Total Receive"
              value={formatCurrency(data.totals.total_receive)}
              tone="text-primary-700"
            />
            <SummaryCard
              label="Total Payment"
              value={formatCurrency(data.totals.total_payment)}
              tone="text-warning-700"
            />
            <SummaryCard
              label="Total Profit"
              value={formatCurrency(data.totals.total_profit)}
              tone="text-success-700"
              highlight
            />
          </div>

          {/* Statement table */}
          <Card padding={false}>
            <div className="p-4 sm:p-5 print:pb-2">
              <CardHeader title="Statement Details" subtitle={`${data.rows?.length || 0} records`} />
            </div>

            {!data.rows || data.rows.length === 0 ? (
              <EmptyState
                title="No transactions"
                message="No transactions found for this period."
                icon={FileText}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="text-left p-3">Txn No</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3 hidden md:table-cell">Account</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-right p-3">Receive</th>
                      <th className="text-right p-3">Payment</th>
                      <th className="text-right p-3">Profit</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.id} className="border-t hover:bg-slate-50">
                        <td className="p-3 font-mono text-xs">{row.transaction_no}</td>
                        <td className="p-3 whitespace-nowrap text-xs">
                          <div>{row.transaction_date}</div>
                          <div className="text-slate-500">{row.transaction_time}</div>
                        </td>
                        <td className="p-3 hidden md:table-cell font-mono text-xs">
                          {row.account?.masked_number || '-'}
                        </td>
                        <td className="p-3 text-right">{formatCurrency(row.amount)}</td>
                        <td className="p-3 text-right text-primary-700">
                          {formatCurrency(row.receive_amount)}
                        </td>
                        <td className="p-3 text-right text-warning-700">
                          {formatCurrency(row.payment_amount)}
                        </td>
                        <td
                          className={`p-3 text-right font-medium ${
                            Number(row.profit) >= 0 ? 'text-success-700' : 'text-danger-700'
                          }`}
                        >
                          {formatCurrency(row.profit)}
                        </td>
                        <td className="p-3">
                          <Badge tone={row.status}>{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold">
                    <tr className="border-t-2 border-slate-200">
                      <td className="p-3" colSpan={3}>
                        TOTAL
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(data.totals.total_receive && data.totals.total_payment
                          ? Number(data.totals.total_receive) + Number(data.totals.total_payment)
                          : 0)}
                      </td>
                      <td className="p-3 text-right text-primary-700">
                        {formatCurrency(data.totals.total_receive)}
                      </td>
                      <td className="p-3 text-right text-warning-700">
                        {formatCurrency(data.totals.total_payment)}
                      </td>
                      <td className="p-3 text-right text-success-700">
                        {formatCurrency(data.totals.total_profit)}
                      </td>
                      <td className="p-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          {/* Print footer */}
          <div className="hidden print:block text-center text-xs text-slate-500 mt-4">
            This is a computer-generated statement. No signature required.
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone = 'text-slate-900', highlight = false }) {
  return (
    <Card padding={false} className={highlight ? 'border-success-200' : ''}>
      <div className="p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className={`text-lg font-bold mt-1 ${tone}`}>{value}</div>
      </div>
    </Card>
  );
}