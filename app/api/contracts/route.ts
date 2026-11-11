import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedActor } from '@/lib/supabase';


/**
 * GET /api/contracts
 * Get contracts for a project
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

    let query = supabase.from('contracts').select('*');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ contracts: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contracts
 * Create new contract
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['owner', 'admin', 'staff'].includes(actor.profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const supabase = actor.supabase;
    const body = await request.json();
    const { project_id, contractor_id, terms, amount, state_code } = body;

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        project_id,
        contractor_id,
        terms,
        amount,
        state_code,
        status: 'draft',
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, contract: data[0] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contracts
 * Update contract
 */
export async function PUT(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['owner', 'admin', 'staff'].includes(actor.profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const supabase = actor.supabase;
    const body = await request.json();
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, contract: data[0] },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contracts
 * Delete contract
 */
export async function DELETE(_request: NextRequest) {
  return NextResponse.json({ error: 'Records are retained; use a governed inactive/void state.' }, { status: 405 });
}
