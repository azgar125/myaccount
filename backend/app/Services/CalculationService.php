<?php

namespace App\Services;

class CalculationService
{
    public function round2(float|int|string $value): float
    {
        return round((float) $value, 2, PHP_ROUND_HALF_UP);
    }

    public function round4(float|int|string $value): float
    {
        return round((float) $value, 4, PHP_ROUND_HALF_UP);
    }

    /**
     * Calculate financials for a Purchase or Sale transaction.
     *
     * @param array $in {
     *   amount_usd: numeric,
     *   purchase_usd: numeric,
     *   percentage: numeric,   // e.g., 84 or 87 (not 0.84)
     * }
     * @return array{amount_usd, purchase_usd, percentage, percentage_amount, total_payable}
     */
    public function calculateTransaction(array $in): array
    {
        $amount    = $this->round2($in['amount_usd'] ?? 0);
        $purchase  = $this->round2($in['purchase_usd'] ?? 0);
        $pct       = $this->round4($in['percentage'] ?? 0);

        $pctAmount = $this->round2($purchase * $pct / 100);
        $payable   = $pctAmount;

        return [
            'amount_usd'         => $amount,
            'purchase_usd'       => $purchase,
            'percentage'         => $pct,
            'percentage_amount'  => $pctAmount,
            'total_payable'      => $payable,
        ];
    }

    /**
     * Calculate profit for a partial sale against a purchase.
     *
     * @param array $in {
     *   sold_quantity: numeric,
     *   purchase_purchase_usd: numeric,     // parent's purchase
     *   purchase_percentage: numeric,       // parent's % (seller side)
     *   sale_percentage: numeric,           // this sale's %
     * }
     */
    public function calculatePartialSaleProfit(array $in): array
    {
        $sold            = $this->round2($in['sold_quantity'] ?? 0);
        $purchaseRate    = $this->round2($in['purchase_purchase_usd'] ?? 0);
        $purchasePct     = $this->round4($in['purchase_percentage'] ?? 0);
        $salePct         = $this->round4($in['sale_percentage'] ?? 0);

        $costOfGoods = $this->round2($sold * $purchasePct / 100);
        $saleAmount  = $this->round2($sold * $salePct / 100);
        $profit      = $this->round2($saleAmount - $costOfGoods);

        return [
            'sold_quantity'  => $sold,
            'sale_percentage'=> $salePct,
            'sale_amount'    => $saleAmount,
            'cost_of_goods'  => $costOfGoods,
            'profit_realized'=> $profit,
        ];
    }
}