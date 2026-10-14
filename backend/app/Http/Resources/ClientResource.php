<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'client_code' => $this->client_code,
            'name'        => $this->name,
            'phone'       => $this->phone,
            'email'       => $this->email,
            'address'     => $this->address,
            'country'     => $this->country,
            'status'      => $this->status->value ?? $this->status,
            'notes'       => $this->notes,

            'accounts'    => ClientAccountResource::collection($this->whenLoaded('accounts')),
            'accounts_count' => $this->when(
                isset($this->accounts_count),
                fn () => (int) $this->accounts_count
            ),

            'created_at'  => $this->created_at?->toDateTimeString(),
            'updated_at'  => $this->updated_at?->toDateTimeString(),
            'deleted_at'  => $this->deleted_at?->toDateTimeString(),
        ];
    }
}