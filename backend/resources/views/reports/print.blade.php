<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $system_name }} — {{ $report_type }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 24px; }
        h1 { font-size: 20px; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
        th { background: #1e40af; color: #fff; }
        .summary td { border: none; padding: 4px 6px; }
        .summary td.label { color: #475569; }
        .summary td.value { text-align: right; font-weight: bold; }
        .right { text-align: right; }
        .muted { color: #555; font-size: 12px; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body onload="window.print()">
    <div class="no-print" style="margin-bottom:12px;">
        <button onclick="window.print()">Print</button>
    </div>

    <table style="border:none;">
        <tr>
            <td style="border:none;"><h1>{{ $system_name }}</h1><div class="muted">{{ $report_type }}</div></td>
            <td style="border:none;" class="right">
                <div><strong>Range:</strong> {{ $range }}</div>
                @if($client_name)<div><strong>Client:</strong> {{ $client_name }}</div>@endif
                <div class="muted">Generated: {{ $generated_at }}</div>
            </td>
        </tr>
    </table>

    <table class="summary" style="width:60%;">
        <tr><td class="label">Total Transactions</td><td class="value">{{ $totals['total_transactions'] }}</td></tr>
        <tr><td class="label">Total Receive</td><td class="value">{{ number_format((float)$totals['total_receive'], 2) }}</td></tr>
        <tr><td class="label">Total Payment</td><td class="value">{{ number_format((float)$totals['total_payment'], 2) }}</td></tr>
        <tr><td class="label">Total Profit</td><td class="value">{{ number_format((float)$totals['total_profit'], 2) }}</td></tr>
    </table>

    <table>
        <thead>
            <tr>@foreach($columns as $col)<th>{{ ucwords(str_replace('_',' ',$col)) }}</th>@endforeach</tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    @foreach($columns as $col)
                        @php $v = is_array($row) ? ($row[$col] ?? '') : ($row->{$col} ?? ''); @endphp
                        <td>
                            @if(in_array($col, ['amount','receive_amount','payment_amount','total_receive','total_payment','profit','total_profit']))
                                {{ number_format((float)$v, 2) }}
                            @else
                                {{ $v }}
                            @endif
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr><td colspan="{{ count($columns) }}" style="text-align:center;">No records</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>