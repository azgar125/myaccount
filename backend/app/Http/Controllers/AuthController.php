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

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (! $user->isActive()) {
            return ApiResponse::error('Account is not active.', [], 403);
        }

        // Login using session (Sanctum SPA)
        Auth::guard('web')->login($user, true);
        $request->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();

        $this->audit->log('LOGIN', 'AUTH', $user->id, null, null, $request);

        return ApiResponse::success([
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $user->role->value,
                'status'    => $user->status->value,
                'client_id' => $user->client_id,
            ],
        ], 'Logged in');
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $this->audit->log('LOGOUT', 'AUTH', $user->id, null, null, $request);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::success(null, 'Logged out');
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated', [], 401);
        }

        return ApiResponse::success([
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'role'      => $user->role->value,
            'status'    => $user->status->value,
            'client_id' => $user->client_id,
        ], 'OK');
    }
}