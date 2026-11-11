import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedActor } from '@/lib/supabase';
import { z } from 'zod';


const projectSchema = z.object({
  customer_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  service_type: z.string(),
  estimated_value: z.number().positive(),
  state_code: z.string().length(2),
});

/**
 * GET /api/projects
 * List projects for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthenticatedActor(request);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['owner', 'admin', 'staff'].includes(actor.profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const supabase = actor.supabase;
    const customerId = request.nextUrl.searchParams.get('customer_id');

    let query = supabase.from('projects').select('*');

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

    return NextResponse.json({ projects: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create new project
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
    const projectData = projectSchema.parse(body);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        customer_id: projectData.customer_id,
        name: projectData.name,
        description: projectData.description,
        service_type: projectData.service_type,
        estimated_value: projectData.estimated_value,
        state_code: projectData.state_code,
        status: 'active',
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
      { success: true, project: data[0] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects
 * Update project
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
      .from('projects')
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
      { success: true, project: data[0] },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects
 * Delete project
 */
export async function DELETE(_request: NextRequest) {
  return NextResponse.json({ error: 'Records are retained; use a governed inactive/void state.' }, { status: 405 });
}
