import { BillingService, NoOpAuditLogger, type BillingAuditLogger } from './index';
import { StripePaymentDriver } from './stripe-driver';

/**
 * Production billing factory. This deliberately has no stub fallback:
 * missing Stripe credentials fail closed instead of simulating a successful charge.
 */
export function createProductionBillingService(
  auditLogger: BillingAuditLogger = new NoOpAuditLogger()
): BillingService {
  return new BillingService(new StripePaymentDriver(), auditLogger);
}
