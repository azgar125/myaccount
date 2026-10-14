<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'client_id'      => $this->client_id,
            'account_type'   => $this->account_type,
            'account_name'   => $this->account_name,
            'provider_name'  => $this->provider_name,

            // IMPORTANT: never expose full card_number
            'masked_number'  => $this->masked_number,
            'last_four'      => $this->last_four,

            'currency'       => $this->currency,
            'status'         => $this->status->value ?? $this->status,
            'notes'          => $this->notes,

            'client'         => new ClientResource($this->whenLoaded('client')),

            'created_at'     => $this->created_at?->toDateTimeString(),
            'updated_at'     => $this->updated_at?->toDateTimeString(),
        ];
    }
}