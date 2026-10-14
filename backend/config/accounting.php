<?php

return [
    'system_name' => env('APP_NAME', 'Client Accounting System'),
    'currency'    => env('ACCOUNTING_CURRENCY', 'USD'),
    'date_format' => env('ACCOUNTING_DATE_FORMAT', 'Y-m-d'),
    'timezone'    => env('APP_TIMEZONE', 'Asia/Dhaka'),

    'defaults' => [
        'receive_percentage' => (float) env('ACCOUNTING_DEFAULT_RECEIVE_PERCENTAGE', 84),
        'payment_percentage' => (float) env('ACCOUNTING_DEFAULT_PAYMENT_PERCENTAGE', 87),
        'profit_mode'        => env('ACCOUNTING_PROFIT_MODE', 'PAYMENT_MINUS_RECEIVE'),
    ],

    'profit_modes' => [
        'PAYMENT_MINUS_RECEIVE',
        'RECEIVE_MINUS_PAYMENT',
        'PERCENTAGE_DIFFERENCE',
        'FIXED_FEE',
        'CUSTOM_COMMISSION',
    ],

    'client_code_prefix' => 'CL-',
    'client_code_padding' => 5,

    'transaction_no_prefix' => 'TX-',

    'card_masking' => [
        'mode' => 'last_four_only', // 'last_four_only' | 'first4_last4'
    ],
];