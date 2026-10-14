<?php

namespace App\Enums;

enum TransactionType: string
{
    case RECEIVE    = 'RECEIVE';
    case PAYMENT    = 'PAYMENT';
    case TRANSFER   = 'TRANSFER';
    case ADJUSTMENT = 'ADJUSTMENT';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}