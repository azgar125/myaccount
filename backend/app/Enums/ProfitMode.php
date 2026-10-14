<?php

namespace App\Enums;

enum ProfitMode: string
{
    case PAYMENT_MINUS_RECEIVE = 'PAYMENT_MINUS_RECEIVE';
    case RECEIVE_MINUS_PAYMENT = 'RECEIVE_MINUS_PAYMENT';
    case PERCENTAGE_DIFFERENCE = 'PERCENTAGE_DIFFERENCE';
    case FIXED_FEE             = 'FIXED_FEE';
    case CUSTOM_COMMISSION     = 'CUSTOM_COMMISSION';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}