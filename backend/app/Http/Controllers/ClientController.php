<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function __construct(private AuditService $audit) {}

    /**
     * GET /api/clients
     * Search + filter + pagination
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $q = Client::query()->with('accounts');

        if ($request->filled('status')) {
            $q->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $q->where(function ($w) use ($s) {
                $w->where('name', 'like', "%{$s}%")
                  ->orWhere('client_code', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $sortBy  = $request->input('sort_by', 'created_at');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowed = ['id', 'client_code', 'name', 'status', 'created_at'];
        if (! in_array($sortBy, $allowed, true)) $sortBy = 'created_at';

        $q->orderBy($sortBy, $sortDir);

        $paginator = $q->paginate($perPage);

        return ApiResponse::success([
            'items' => ClientResource::collection($paginator->items()),
            'meta'  => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 'Clients');
    }

    /**
     * POST /api/clients
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:150'],
            'phone'   => ['nullable', 'string', 'max:40'],
            'email'   => ['nullable', 'email', 'max:191'],
            'address' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:80'],
            'status'  => ['nullable', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
            'notes'   => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            $data['client_code'] = Client::generateCode();
            $data['status']      = $data['status'] ?? 'ACTIVE';

            $client = Client::create($data);

            $this->audit->log('CREATE', 'CLIENT', $client->id, null, $client->toArray(), $request);

            return ApiResponse::success(new ClientResource($client), 'Client created', 201);
        });
    }

    /**
     * GET /api/clients/{id}
     */
    public function show(Client $client)
    {
        $client->load(['accounts']);

        return ApiResponse::success(new ClientResource($client), 'Client');
    }

    /**
     * PUT /api/clients/{id}
     */
    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'name'    => ['sometimes', 'string', 'max:150'],
            'phone'   => ['nullable', 'string', 'max:40'],
            'email'   => ['nullable', 'email', 'max:191'],
            'address' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:80'],
            'status'  => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
            'notes'   => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($client, $data, $request) {
            $old = $client->toArray();
            $client->update($data);

            $this->audit->log('UPDATE', 'CLIENT', $client->id, $old, $client->fresh()->toArray(), $request);

            return ApiResponse::success(new ClientResource($client->fresh()), 'Client updated');
        });
    }

    /**
     * DELETE /api/clients/{id}  (soft delete)
     */
    public function destroy(Request $request, Client $client)
    {
        return DB::transaction(function () use ($client, $request) {
            $old = $client->toArray();
            $client->delete(); // SoftDeletes

            $this->audit->log('DELETE', 'CLIENT', $client->id, $old, null, $request);

            return ApiResponse::success(null, 'Client deleted');
        });
    }
}