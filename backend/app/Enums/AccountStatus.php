<?php

namespace App\Enums;

enum AccountStatus: string
{
    case ACTIVE   = 'ACTIVE';
    case INACTIVE = 'INACTIVE';
    case BLOCKED  = 'BLOCKED';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}