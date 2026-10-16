<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ✅ Render/proxy-র পিছনে HTTPS detect করার জন্য must
        $middleware->trustProxies(at: '*');

        // ✅ Sanctum stateful middleware — SPA auth-এর জন্য
        // এটাই automatically session + cookie middleware load করে
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        // ✅ Role middleware alias register
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Unauthenticated হলে JSON return করবে (redirect না)
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();


// use Illuminate\Foundation\Application;
// use Illuminate\Foundation\Configuration\Exceptions;
// use Illuminate\Foundation\Configuration\Middleware;
// use Illuminate\Session\Middleware\StartSession;

// return Application::configure(basePath: dirname(__DIR__))
//     ->withRouting(
//         web: __DIR__ . '/../routes/web.php',
//         api: __DIR__ . '/../routes/api.php',
//         commands: __DIR__ . '/../routes/console.php',
//         health: '/up',
//     )

//     ->withMiddleware(function (Middleware $middleware) {

//         /*
//         |--------------------------------------------------------------------------
//         | Middleware Aliases
//         |--------------------------------------------------------------------------
//         */

//         $middleware->alias([
//             'role' => \App\Http\Middleware\EnsureRole::class,   // ✅ FIXED
//         ]);

//          /*
//         |--------------------------------------------------------------------------
//         | ✅ Sanctum Stateful API — CRITICAL for SPA cookie auth
//         |--------------------------------------------------------------------------
//         | This ensures /api/* routes get:
//         |   - EnsureFrontendRequestsAreStateful
//         |   - StartSession
//         |   - VerifyCsrfToken
//         |   - session cookie handling
//         */
//         $middleware->statefulApi();

//         /*
//         |--------------------------------------------------------------------------
//         | Start Session for API (Sanctum SPA)
//         |--------------------------------------------------------------------------
//         */

//         $middleware->appendToGroup('api', [
//             StartSession::class,
//         ]);

//         /*
//         |--------------------------------------------------------------------------
//         | CSRF Exception
//         |--------------------------------------------------------------------------
//         */

//         $middleware->validateCsrfTokens(except: [
//             'api/*',
//         ]);
//     })

//     ->withExceptions(function (Exceptions $exceptions) {
//         //
//     })
//     ->create();