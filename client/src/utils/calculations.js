/**
 * Frontend PREVIEW calculation only.
 * Backend recomputes everything before saving.
 */

export function round2(n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}

export function round4(n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 10000) / 10000;
}

/**
 * Purchase or Sale transaction preview.
 */
export function calculateTransaction({ amountUsd, purchaseUsd, percentage }) {
  const amount   = round2(amountUsd);
  const purchase = round2(purchaseUsd);
  const pct      = round4(percentage);

  const pctAmount = round2(purchase * pct / 100);

  return {
    amountUsd: amount,
    purchaseUsd: purchase,
    percentage: pct,
    percentageAmount: pctAmount,
    totalPayable: pctAmount,
  };
}

/**
 * Partial sale profit preview.
 * Profit = (Sale% − Purchase%) × Sold / 100
 */
export function calculatePartialSaleProfit({
  soldQuantity,
  purchasePercentage,
  salePercentage,
}) {
  const sold       = round2(soldQuantity);
  const purchasePct = round4(purchasePercentage);
  const salePct     = round4(salePercentage);

  const costOfGoods  = round2(sold * purchasePct / 100);
  const saleAmount   = round2(sold * salePct / 100);
  const profit       = round2(saleAmount - costOfGoods);

  return {
    soldQuantity: sold,
    salePercentage: salePct,
    saleAmount,
    costOfGoods,
    profitRealized: profit,
  };
}

/**
 * Pending profit for remaining quantity (based on expected sale %).
 */
export function calculatePendingProfit({
  remainingQuantity,
  purchasePercentage,
  expectedSalePercentage,
}) {
  const rem = round2(remainingQuantity);
  const purchasePct = round4(purchasePercentage);
  const salePct = round4(expectedSalePercentage);

  const unitProfit = round4(salePct - purchasePct);
  return round2(rem * unitProfit / 100);
}