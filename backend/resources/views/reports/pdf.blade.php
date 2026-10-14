<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $system_name }} — {{ $report_type }}</title>
    <style>
        * { font-family: DejaVu Sans, Arial, sans-serif; }
        body { font-size: 11px; color: #111; margin: 20px; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .muted { color: #555; }
        .header { border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 14px; }
        .header .right { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #1e40af; color: #fff; font-size: 11px; }
        tfoot td { font-weight: bold; background: #f1f5f9; }
        .summary { margin-top: 14px; }
        .summary table { width: 60%; }
        .summary td { border: none; padding: 3px 6px; }
        .summary td.label { color: #475569; }
        .summary td.value { text-align: right; font-weight: bold; }
        .profit-positive { color: #15803d; font-weight: bold; }
        .profit-negative { color: #b91c1c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <table style="border:none;">
            <tr>
                <td style="border:none;">
                    <h1>{{ $system_name }}</h1>
                    <div class="muted">{{ $report_type }}</div>
                </td>
                <td style="border:none;" class="right">
                    <div><strong>Range:</strong> {{ $range }}</div>
                    @if($client_name)
                        <div><strong>Client:</strong> {{ $client_name }}</div>
                    @endif
                    <div class="muted">Generated: {{ $generated_at }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="summary">
        <table>
            <tr>
                <td class="label">Total Transactions</td>
                <td class="value">{{ $totals['total_transactions'] }}</td>
                <td class="label">Currency</td>
                <td class="value">{{ $currency }}</td>
            </tr>
            <tr>
                <td class="label">Total Receive</td>
                <td class="value">{{ number_format((float)$totals['total_receive'], 2) }}</td>
                <td class="label">Total Payment</td>
                <td class="value">{{ number_format((float)$totals['total_payment'], 2) }}</td>
            </tr>
            <tr>
                <td class="label">Total Profit</td>
                <td class="value {{ (float)$totals['total_profit'] >= 0 ? 'profit-positive' : 'profit-negative' }}">
                    {{ number_format((float)$totals['total_profit'], 2) }}
                </td>
                <td></td><td></td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                @foreach($columns as $col)
                    <th>{{ ucwords(str_replace('_', ' ', $col)) }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    @foreach($columns as $col)
                        @php $v = is_array($row) ? ($row[$col] ?? '') : ($row->{$col} ?? ''); @endphp
                        <td>
                            @if(in_array($col, ['amount','receive_amount','payment_amount','total_receive','total_payment']))
                                {{ number_format((float)$v, 2) }}
                            @elseif($col === 'profit' || $col === 'total_profit')
                                <span class="{{ (float)$v >= 0 ? 'profit-positive' : 'profit-negative' }}">
                                    {{ number_format((float)$v, 2) }}
                                </span>
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