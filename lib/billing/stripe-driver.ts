import Stripe from 'stripe';
import type {
  ChargeResult,
  PaymentDriver,
  PaymentIntent,
  PaymentStatus,
  RefundResult,
} from './index';

function mapStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  switch (status) {
    case 'succeeded': return 'succeeded';
    case 'processing': return 'processing';
    case 'canceled': return 'failed';
    default: return 'pending';
  }
}

export class StripePaymentDriver implements PaymentDriver {
  private stripe: Stripe;

  constructor(secretKey = process.env.STRIPE_SECRET_KEY) {
    if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey, { apiVersion: '2026-04-22.dahlia' });
  }

  async createPaymentIntent(
    projectId: string,
    clientId: string,
    amountCents: number,
    currency: string,
    description: string,
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    const created = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      description,
      capture_method: 'manual',
      automatic_payment_methods: { enabled: true },
      metadata: { projectId, clientId, ...metadata },
    });

    return {
      id: created.id,
      projectId,
      clientId,
      amountCents: created.amount,
      currency: created.currency,
      status: mapStatus(created.status),
      description,
      createdAt: created.created * 1000,
      updatedAt: Date.now(),
      metadata: created.metadata,
    };
  }

  async capturePayment(paymentIntentId: string): Promise<ChargeResult> {
    try {
      const captured = await this.stripe.paymentIntents.capture(paymentIntentId);
      const status = mapStatus(captured.status);
      return { success: status === 'succeeded', paymentIntentId, status };
    } catch (error) {
      return {
        success: false,
        paymentIntentId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Stripe capture failed',
      };
    }
  }

  async refundPayment(paymentIntentId: string, amountCents?: number): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        ...(amountCents === undefined ? {} : { amount: amountCents }),
      });
      return {
        success: refund.status === 'succeeded' || refund.status === 'pending',
        refundId: refund.id,
        paymentIntentId,
        amountCents: refund.amount,
      };
    } catch (error) {
      return {
        success: false,
        refundId: '',
        paymentIntentId,
        amountCents: amountCents ?? 0,
        error: error instanceof Error ? error.message : 'Stripe refund failed',
      };
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return mapStatus(intent.status);
    } catch {
      return 'failed';
    }
  }
}
