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
        // ✅ CORS middleware সবার আগে — preflight requests handle করার জন্য
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        // ✅ Sanctum stateful middleware — SPA auth-এর জন্য
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        // ✅ API routes-এ StartSession + CSRF cookie পাঠানোর জন্য
        $middleware->api(append: [
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
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