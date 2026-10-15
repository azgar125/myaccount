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

    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'https://client-eight-blond-99.vercel.app'),
        'https://client-accounting-system.onrender.com',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:4173',
        'myaccount-iota-three.vercel.app',
        'myaccount-git-main-azgarbd-3062s-projects.vercel.app',
        'https://myaccount-production-a114.up.railway.app/'
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];



