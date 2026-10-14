<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case PENDING   = 'PENDING';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';
    case FAILED    = 'FAILED';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}