import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedActor } from '@/lib/supabase';
import { z } from 'zod';


const transactionSchema = z.object({
  project_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  type: z.enum(['deposit', 'payment', 'refund']),
  amount: z.number().positive(),
  reference_id: z.string(),
  state_code: z.string().length(2),
});

/**
 * GET /api/transactions
 * Get transactions for a project
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['owner', 'admin', 'staff'].includes(actor.profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const supabase = actor.supabase;
    const projectId = request.nextUrl.searchParams.get('project_id');
    const customerId = request.nextUrl.searchParams.get('customer_id');

    let query = supabase.from('transactions').select('*');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Create new transaction (payment/deposit/refund)
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Transactions are created only by verified payment webhooks.' }, { status: 405 });
}

/** PUT /api/transactions */
export async function PUT(_request: NextRequest) {
  return NextResponse.json({ error: 'Transactions are append-only.' }, { status: 405 });
}
