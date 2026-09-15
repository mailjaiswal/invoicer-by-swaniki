import { Card, CardContent } from "@/components/common/card";
import { formatMoney } from "@/lib/formatting";
import type { InvoiceCalculation } from "@/lib/calculations";
import type { CurrencyCode } from "@/lib/types";

interface BuilderTotalsProps {
  calc: InvoiceCalculation;
  currency: CurrencyCode;
}

export function BuilderTotals({ calc, currency }: BuilderTotalsProps) {
  const totals = calc.totals;
  const money = (amount: number) => formatMoney(amount, currency);

  return (
    <Card>
      <CardContent className="space-y-1.5 p-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Subtotal</span>
          <span className="font-medium text-stone-800">
            {money(totals.subtotal)}
          </span>
        </div>
        {totals.discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Discount</span>
            <span className="font-medium text-stone-800">
              −{money(totals.discount)}
            </span>
          </div>
        )}
        {totals.taxTotal > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Taxable amount</span>
              <span className="font-medium text-stone-800">
                {money(totals.taxableAmount)}
              </span>
            </div>
            {totals.breakup.cgst > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-500">CGST</span>
                <span className="font-medium text-stone-800">
                  {money(totals.breakup.cgst)}
                </span>
              </div>
            )}
            {totals.breakup.sgst > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-500">SGST</span>
                <span className="font-medium text-stone-800">
                  {money(totals.breakup.sgst)}
                </span>
              </div>
            )}
            {totals.breakup.igst > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-500">IGST</span>
                <span className="font-medium text-stone-800">
                  {money(totals.breakup.igst)}
                </span>
              </div>
            )}
            {totals.breakup.other > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Tax</span>
                <span className="font-medium text-stone-800">
                  {money(totals.breakup.other)}
                </span>
              </div>
            )}
          </>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-2 dark:border-stone-700">
          <span className="text-sm font-semibold text-stone-900">
            Total
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-stone-950 dark:text-white">
            {money(totals.total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}