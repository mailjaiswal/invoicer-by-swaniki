import type { BadgeProps } from "@/components/common/badge";
import { Badge } from "@/components/common/badge";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
} from "@/lib/invoice-status";
import type { InvoiceStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={INVOICE_STATUS_VARIANT[status] as NonNullable<BadgeProps["variant"]>}
      className={className}
    >
      {INVOICE_STATUS_LABEL[status]}
    </Badge>
  );
}