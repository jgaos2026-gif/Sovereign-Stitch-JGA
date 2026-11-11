import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/**
 * Server-side Supabase client using the service-role key.
 * Use only in API routes / server components — never expose to the browser.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

/**
 * Browser-safe Supabase client using the public anon key.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  return createClient(url, anonKey);
}

export async function getAuthenticatedActor(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? '';
  const bearer = /^Bearer\\s+([^\\s]+)$/i.exec(authorization)?.[1];
  const token = bearer ||
    request.cookies.get('sb-access-token')?.value ||
    request.cookies.get('supabase-auth-token')?.value;
  if (!token) return null;
  const supabase = createServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return null;
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('id, role, state_tag').eq('id', authData.user.id).single();
  if (profileError || !profile) return null;
  return { supabase, user: authData.user, profile };
}
