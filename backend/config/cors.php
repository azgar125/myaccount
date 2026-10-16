<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'register',
        'user',
        'user/*',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_filter([
        env('FRONTEND_URL'),
        'https://myaccount-iota-three.vercel.app',
        'https://client-eight-blond-99.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:4173',
    ]))),

    'allowed_origins_patterns' => [
        '#^https://myaccount-.*\.vercel\.app$#',
        '#^https://client-.*\.vercel\.app$#',
        '#^https://.*\.up\.railway\.app$#',
        '#^http://localhost:\d+$#',
        '#^http://127\.0\.0\.1:\d+$#',
    ],

    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
        'Accept-Language',
        'Cache-Control',
        'Pragma',
    ],

    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
    ],

    'max_age' => 86400,

    'supports_credentials' => true,

];

// return [

//     'paths' => [
//         'api/*',
//         'sanctum/csrf-cookie',
//         'login',
//         'logout',
//         'register',
//     ],

//     'allowed_methods' => ['*'],

//     'allowed_origins' => array_values(array_unique(array_filter([
//         env('FRONTEND_URL', 'https://myaccount-iota-three.vercel.app'),
//         'https://myaccount-iota-three.vercel.app',
//         'https://client-eight-blond-99.vercel.app',
//         'https://client-accounting-system.onrender.com',
//         'https://myaccount-production-a114.up.railway.app',
//         'http://localhost:5173',
//         'http://localhost:3000',
//         'http://localhost:4173',
//     ]))),

//     'allowed_origins_patterns' => [
//         '#^https://myaccount-.*\.vercel\.app$#',
//         '#^https://client-.*\.vercel\.app$#',
//     ],

//     'allowed_headers' => ['*'],

//     'exposed_headers' => [],

//     'max_age' => 86400,

//     'supports_credentials' => true,

// ];


