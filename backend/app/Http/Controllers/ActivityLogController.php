<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = ActivityLog::query()
            ->when($request->user_id, fn($q, $id) => $q->where('user_id', $id))
            ->when($request->action, fn($q, $action) => $q->where('action', $action))
            ->when($request->module, fn($q, $module) => $q->where('module', $module))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }

    public function show(ActivityLog $activityLog)
    {
        return response()->json([
            'success' => true,
            'data'    => $activityLog->load(['user', 'client']),
        ]);
    }
}