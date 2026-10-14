<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportExport implements FromArray, WithHeadings, WithStyles
{
    public function __construct(private array $payload) {}

    public function headings(): array
    {
        return array_map(
            fn ($c) => ucwords(str_replace('_', ' ', $c)),
            $this->payload['columns']
        );
    }

    public function array(): array
    {
        $rows = [];

        foreach ($this->payload['rows'] as $row) {
            $line = [];
            foreach ($this->payload['columns'] as $col) {
                $v = is_array($row) ? ($row[$col] ?? '') : ($row->{$col} ?? '');
                $line[] = $v;
            }
            $rows[] = $line;
        }

        // Totals footer
        $rows[] = [];
        $rows[] = [
            'TOTAL',
            'Receive: '.$this->payload['totals']['total_receive'],
            'Payment: '.$this->payload['totals']['total_payment'],
            'Profit: '.$this->payload['totals']['total_profit'],
        ];

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                  'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E40AF']]],
        ];
    }
}