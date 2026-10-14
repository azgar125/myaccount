<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Helpers\ApiResponse;
use App\Http\Resources\UserResource;
use App\Models\Client;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(private AuditService $audit) {}

    /**
     * GET /api/users
     * Filters: role, status, search, client_id
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $q = User::query()->with(['client:id,client_code,name']);

        if ($request->filled('role') && in_array($request->input('role'), UserRole::values(), true)) {
            $q->where('role', $request->input('role'));
        }

        if ($request->filled('status') && in_array($request->input('status'), UserStatus::values(), true)) {
            $q->where('status', $request->input('status'));
        }

        if ($request->filled('client_id')) {
            $q->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $q->where(function ($w) use ($s) {
                $w->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $sortBy  = $request->input('sort_by', 'created_at');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowed = ['id', 'name', 'email', 'role', 'status', 'created_at'];
        if (! in_array($sortBy, $allowed, true)) $sortBy = 'created_at';

        $q->orderBy($sortBy, $sortDir);

        $paginator = $q->paginate($perPage);

        return ApiResponse::success([
            'items' => UserResource::collection($paginator->items()),
            'meta'  => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 'Users');
    }

    /**
     * POST /api/users
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:150'],
            'email'     => ['required', 'email', 'max:191', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8', 'max:100'],
            'role'      => ['required', Rule::in(UserRole::values())],
            'status'    => ['nullable', Rule::in(UserStatus::values())],
            'client_id' => [
                'nullable',
                'integer',
                'exists:clients,id',
                Rule::requiredIf(fn () => $request->input('role') === UserRole::CLIENT->value),
            ],
        ]);

        // A CLIENT user must be linked to a client that isn't already linked to another CLIENT user
        if (($data['role'] ?? null) === UserRole::CLIENT->value && ! empty($data['client_id'])) {
            $already = User::where('client_id', $data['client_id'])
                ->where('role', UserRole::CLIENT->value)
                ->exists();

            if ($already) {
                return ApiResponse::error('This client already has a login user.', [], 422);
            }

            $client = Client::find($data['client_id']);
            if (! $client) {
                return ApiResponse::error('Client not found.', [], 422);
            }
        }

        // ADMIN role must not have client_id
        if (($data['role'] ?? null) === UserRole::ADMIN->value) {
            $data['client_id'] = null;
        }

        return DB::transaction(function () use ($data, $request) {
            $data['status']   = $data['status'] ?? UserStatus::ACTIVE->value;
            $data['password'] = Hash::make($data['password']);

            $user = User::create($data);

            $this->audit->log('CREATE', 'USER', $user->id, null, $this->safeUserArray($user), $request);

            return ApiResponse::success(
                new UserResource($user->load('client')),
                'User created',
                201
            );
        });
    }

    /**
     * GET /api/users/{id}
     */
    public function show(User $user)
    {
        $user->load('client:id,client_code,name');

        return ApiResponse::success(new UserResource($user), 'User');
    }

    /**
     * PUT /api/users/{id}
     */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'      => ['sometimes', 'string', 'max:150'],
            'email'     => ['sometimes', 'email', 'max:191', Rule::unique('users', 'email')->ignore($user->id)],
            'password'  => ['nullable', 'string', 'min:8', 'max:100'],
            'role'      => ['sometimes', Rule::in(UserRole::values())],
            'status'    => ['sometimes', Rule::in(UserStatus::values())],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
        ]);

        // Cannot downgrade yourself from ADMIN and lose access
        if ($request->user()->id === $user->id
            && isset($data['role'])
            && $data['role'] !== UserRole::ADMIN->value) {
            return ApiResponse::error('You cannot change your own role.', [], 422);
        }

        // If role is CLIENT, client_id required
        $newRole = $data['role'] ?? ($user->role->value ?? $user->role);
        if ($newRole === UserRole::CLIENT->value) {
            $clientId = $data['client_id'] ?? $user->client_id;
            if (! $clientId) {
                return ApiResponse::error('CLIENT role requires a client_id.', [], 422);
            }

            $already = User::where('client_id', $clientId)
                ->where('role', UserRole::CLIENT->value)
                ->where('id', '!=', $user->id)
                ->exists();

            if ($already) {
                return ApiResponse::error('This client already has a login user.', [], 422);
            }

            $data['client_id'] = $clientId;
        } else {
            // ADMIN
            $data['client_id'] = null;
        }

        // Prevent deactivating yourself
        if ($request->user()->id === $user->id
            && isset($data['status'])
            && $data['status'] !== UserStatus::ACTIVE->value) {
            return ApiResponse::error('You cannot deactivate your own account.', [], 422);
        }

        return DB::transaction(function () use ($user, $data, $request) {
            $old = $this->safeUserArray($user);

            if (! empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            $user->update($data);

            $this->audit->log('UPDATE', 'USER', $user->id, $old, $this->safeUserArray($user->fresh()), $request);

            return ApiResponse::success(
                new UserResource($user->fresh()->load('client')),
                'User updated'
            );
        });
    }

    /**
     * DELETE /api/users/{id}
     */
    public function destroy(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return ApiResponse::error('You cannot delete your own account.', [], 422);
        }

        // Prevent deleting the last active admin
        if ($user->role === UserRole::ADMIN) {
            $otherAdmins = User::where('role', UserRole::ADMIN->value)
                ->where('id', '!=', $user->id)
                ->where('status', UserStatus::ACTIVE->value)
                ->count();

            if ($otherAdmins === 0) {
                return ApiResponse::error('Cannot delete the last active admin.', [], 422);
            }
        }

        // Prevent deletion of users that created transactions (FK restrict)
        if ($user->transactions()->exists()) {
            return ApiResponse::error(
                'Cannot delete user with existing transactions. Deactivate instead.',
                [],
                422
            );
        }

        return DB::transaction(function () use ($user, $request) {
            $old = $this->safeUserArray($user);

            $user->delete();

            $this->audit->log('DELETE', 'USER', $user->id, $old, null, $request);

            return ApiResponse::success(null, 'User deleted');
        });
    }

    /**
     * Strip password from array for audit logs.
     */
    private function safeUserArray(User $user): array
    {
        $arr = $user->toArray();
        unset($arr['password'], $arr['remember_token']);
        return $arr;
    }
}