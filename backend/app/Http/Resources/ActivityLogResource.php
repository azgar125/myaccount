<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'user_id'    => $this->user_id,
            'user_name'  => $this->user_name,
            'action'     => $this->action,
            'module'     => $this->module,
            'record_id'  => $this->record_id,
            'old_value'  => $this->old_value,
            'new_value'  => $this->new_value,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}