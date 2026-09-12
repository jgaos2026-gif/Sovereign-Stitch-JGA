import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { eventBus, createEvent, EventTopics } from '@/lib/event-system';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-04-22.dahlia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ status: 'ignored', event: event.type }, { status: 200 });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const projectId = intent.metadata.projectId;
  const stateCode = intent.metadata.stateTag;
  const paymentStage = intent.metadata.paymentStage;

  if (!projectId || !stateCode || !paymentStage) {
    return NextResponse.json({ error: 'Missing trusted Stripe metadata' }, { status: 400 });
  }

  if (paymentStage !== 'deposit' && paymentStage !== 'final') {
    return NextResponse.json({ error: 'Invalid payment stage' }, { status: 400 });
  }

  const amount = intent.amount_received / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
  }

  // Idempotency: Stripe retries webhooks. Never record the same PaymentIntent twice.
  const { data: existing, error: lookupError } = await supabase
    .from('transactions')
    .select('id')
    .eq('reference_id', intent.id)
    .maybeSingle();

  if (lookupError) {
    console.error('Stripe webhook idempotency lookup failed:', lookupError);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ status: 'already_received' }, { status: 200 });
  }

  const { error: insertError } = await supabase.from('transactions').insert({
    state_code: stateCode,
    project_id: projectId,
    type: paymentStage === 'deposit' ? 'deposit' : 'payment',
    amount,
    reference_id: intent.id,
  });

  if (insertError) {
    console.error('Stripe transaction insert failed:', insertError);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  if (paymentStage === 'deposit') {
    const { error: projectError } = await supabase
      .from('projects')
      .update({ deposit_status: 'confirmed' })
      .eq('id', projectId)
      .eq('state_code', stateCode);

    if (projectError) {
      console.error('Stripe deposit project update failed:', projectError);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    const depositEvent = createEvent(
      'deposit_confirmed',
      EventTopics.DEPOSIT_CONFIRMED,
      { project_id: projectId, amount, transaction_id: intent.id, state_code: stateCode },
      'stripe',
      stateCode
    );
    await eventBus.publish(depositEvent);
  }

  return NextResponse.json({ status: 'received' }, { status: 200 });
}
