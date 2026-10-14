<?php

namespace App\Enums;

enum UserStatus: string
{
    case ACTIVE    = 'ACTIVE';
    case INACTIVE  = 'INACTIVE';
    case SUSPENDED = 'SUSPENDED';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}