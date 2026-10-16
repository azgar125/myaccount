<?php



namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function __construct(private AuditService $audit) {}

    /**
     * LOGIN
     * 
     * Supports both:
     * - Session-based auth (Sanctum SPA / cookies)
     * - Token-based auth (Bearer tokens) as fallback
     */
    public function login(Request $request)
    {
        // ─────────────────────────────────────────
        // 1. VALIDATE INPUT
        // ─────────────────────────────────────────
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // ─────────────────────────────────────────
        // 2. FIND USER
        // ─────────────────────────────────────────
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // ─────────────────────────────────────────
        // 3. CHECK ACTIVE STATUS
        // ─────────────────────────────────────────
        if (! $user->isActive()) {
            return ApiResponse::error('Account is not active.', [], 403);
        }

        // ─────────────────────────────────────────
        // 4. SESSION-BASED LOGIN (Sanctum SPA)
        // ─────────────────────────────────────────
        Auth::guard('web')->login($user, true);
        $request->session()->regenerate();

        // ─────────────────────────────────────────
        // 5. CREATE API TOKEN (Fallback for mobile/API clients)
        // ─────────────────────────────────────────
        $token = $user->createToken('auth-token')->plainTextToken;

        // ─────────────────────────────────────────
        // 6. UPDATE LAST LOGIN
        // ─────────────────────────────────────────
        $user->forceFill(['last_login_at' => now()])->save();

        // ─────────────────────────────────────────
        // 7. AUDIT LOG
        // ─────────────────────────────────────────
        $this->audit->log('LOGIN', 'AUTH', $user->id, null, null, $request);

        // ─────────────────────────────────────────
        // 8. RESPONSE
        // ─────────────────────────────────────────
        return ApiResponse::success([
            'user' => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'role'          => $user->role->value,
                'status'        => $user->status->value,
                'client_id'     => $user->client_id,
                'last_login_at' => $user->last_login_at,
            ],
            'token' => $token,  // ✅ Both session AND token
        ], 'Logged in');
    }

    /**
     * LOGOUT
     * 
     * Handles both:
     * - Session-based logout (SPA)
     * - Token revocation (mobile/API)
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        // ─────────────────────────────────────────
        // 1. AUDIT LOG
        // ─────────────────────────────────────────
        if ($user) {
            $this->audit->log('LOGOUT', 'AUTH', $user->id, null, null, $request);
        }

        // ─────────────────────────────────────────
        // 2. REVOKE CURRENT API TOKEN (if any)
        // ─────────────────────────────────────────
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        // ─────────────────────────────────────────
        // 3. SESSION LOGOUT (SPA)
        // ─────────────────────────────────────────
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::success(null, 'Logged out');
    }

    /**
     * CURRENT USER (me)
     * 
     * Returns current authenticated user's info.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated', [], 401);
        }

        return ApiResponse::success([
            'id'            => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'role'          => $user->role->value,
            'status'        => $user->status->value,
            'client_id'     => $user->client_id,
            'last_login_at' => $user->last_login_at,
        ], 'OK');
    }
}


// namespace App\Http\Controllers;

// use App\Helpers\ApiResponse;
// use App\Services\AuditService;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Auth;
// use Illuminate\Support\Facades\Hash;
// use Illuminate\Validation\ValidationException;
// use App\Models\User;

// class AuthController extends Controller
// {
//     public function __construct(private AuditService $audit) {}

//     public function login(Request $request)
//     {
//         $credentials = $request->validate([
//             'email'    => ['required', 'email'],
//             'password' => ['required', 'string'],
//         ]);

//         $user = User::where('email', $credentials['email'])->first();

//         if (! $user || ! Hash::check($credentials['password'], $user->password)) {
//             throw ValidationException::withMessages([
//                 'email' => ['Invalid credentials.'],
//             ]);
//         }

//         if (! $user->isActive()) {
//             return ApiResponse::error('Account is not active.', [], 403);
//         }

//         // Login using session (Sanctum SPA)
//         Auth::guard('web')->login($user, true);
//         $request->session()->regenerate();

//         $user->forceFill(['last_login_at' => now()])->save();

//         $this->audit->log('LOGIN', 'AUTH', $user->id, null, null, $request);

//         return ApiResponse::success([
//             'user' => [
//                 'id'        => $user->id,
//                 'name'      => $user->name,
//                 'email'     => $user->email,
//                 'role'      => $user->role->value,
//                 'status'    => $user->status->value,
//                 'client_id' => $user->client_id,
//             ],
//         ], 'Logged in');
//     }

//     public function logout(Request $request)
//     {
//         $user = $request->user();

//         if ($user) {
//             $this->audit->log('LOGOUT', 'AUTH', $user->id, null, null, $request);
//         }

//         Auth::guard('web')->logout();
//         $request->session()->invalidate();
//         $request->session()->regenerateToken();

//         return ApiResponse::success(null, 'Logged out');
//     }

//     public function me(Request $request)
//     {
//         $user = $request->user();

//         if (! $user) {
//             return ApiResponse::error('Unauthenticated', [], 401);
//         }

//         return ApiResponse::success([
//             'id'        => $user->id,
//             'name'      => $user->name,
//             'email'     => $user->email,
//             'role'      => $user->role->value,
//             'status'    => $user->status->value,
//             'client_id' => $user->client_id,
//         ], 'OK');
//     }
// }