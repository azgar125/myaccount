<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ReportExport;

class ExportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    private function clientScope(Request $request): ?int
    {
        $user = $request->user();
        return $user->isClient()
            ? (int) $user->client_id
            : ($request->filled('client_id') ? (int) $request->input('client_id') : null);
    }

    /* -------------------------------------------------
     |  PDF export — /api/export/pdf?type=daily|weekly|monthly
     ------------------------------------------------- */

    public function pdf(Request $request)
    {
        $type = $request->input('type', 'daily');

        $payload = $this->buildPayload($request, $type);

        $pdf = Pdf::loadView('reports.pdf', $payload)
            ->setPaper('a4', 'portrait');

        $filename = 'report-'.$type.'-'.now()->format('Ymd-His').'.pdf';

        return $pdf->download($filename);
    }

    /* -------------------------------------------------
     |  Excel export
     ------------------------------------------------- */

    public function excel(Request $request)
    {
        $type = $request->input('type', 'daily');
        $payload = $this->buildPayload($request, $type);

        $filename = 'report-'.$type.'-'.now()->format('Ymd-His').'.xlsx';

        return Excel::download(new ReportExport($payload), $filename);
    }

    /* -------------------------------------------------
     |  Print view (HTML for browser print)
     ------------------------------------------------- */

    public function print(Request $request)
    {
        $type = $request->input('type', 'daily');
        $payload = $this->buildPayload($request, $type);

        return view('reports.print', $payload);
    }

    /* -------------------------------------------------
     |  Build report payload from type
     ------------------------------------------------- */

    private function buildPayload(Request $request, string $type): array
    {
        $clientId = $this->clientScope($request);

        $systemName = config('accounting.system_name');
        $currency   = config('accounting.currency');

        switch ($type) {
            case 'weekly':
                $start = $request->filled('start')
                    ? Carbon::parse($request->input('start'))
                    : Carbon::now()->startOfWeek();
                $end = $request->filled('end')
                    ? Carbon::parse($request->input('end'))
                    : Carbon::now()->endOfWeek();

                $data = $this->reports->weekly($start, $end, $clientId);
                $range = $start->toDateString().' → '.$end->toDateString();
                $rows = $data['days'];
                $columns = ['date','total_receive','total_payment','total_profit'];
                break;

            case 'monthly':
                $year  = (int) ($request->input('year')  ?: now()->year);
                $month = (int) ($request->input('month') ?: now()->month);
                $data = $this->reports->monthly($year, $month, $clientId);
                $range = sprintf('%04d-%02d', $year, $month);
                $rows = $data['days'];
                $columns = ['date','total_receive','total_payment','total_profit'];
                break;

            case 'daily':
            default:
                $date = $request->filled('date')
                    ? Carbon::parse($request->input('date'))
                    : Carbon::today();
                $data = $this->reports->daily($date, $clientId);
                $range = $date->toDateString();
                $rows = collect($data['rows'])->map(fn ($t) => [
                    'transaction_no' => $t->transaction_no,
                    'client'         => $t->client->name ?? '',
                    'account'        => $t->account->masked_number ?? '',
                    'amount'         => $t->amount,
                    'receive_amount' => $t->receive_amount,
                    'payment_amount' => $t->payment_amount,
                    'profit'         => $t->profit,
                    'status'         => $t->status->value ?? $t->status,
                ])->all();
                $columns = ['transaction_no','client','account','amount','receive_amount','payment_amount','profit','status'];
                break;
        }

        $clientName = null;
        if ($clientId) {
            $clientName = optional(\App\Models\Client::find($clientId))->name;
        }

        return [
            'system_name' => $systemName,
            'report_type' => ucfirst($type).' Report',
            'range'       => $range,
            'client_name' => $clientName,
            'currency'    => $currency,
            'totals'      => $data['totals'],
            'rows'        => $rows,
            'columns'     => $columns,
            'generated_at'=> now()->toDateTimeString(),
        ];
    }
}