<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'register',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_filter([
        env('FRONTEND_URL', 'https://myaccount-iota-three.vercel.app'),
        'https://myaccount-iota-three.vercel.app',
        'https://client-eight-blond-99.vercel.app',
        'https://client-accounting-system.onrender.com',
        'https://myaccount-production-a114.up.railway.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173',
    ]))),

    'allowed_origins_patterns' => [
        '#^https://myaccount-.*\.vercel\.app$#',
        '#^https://client-.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];


