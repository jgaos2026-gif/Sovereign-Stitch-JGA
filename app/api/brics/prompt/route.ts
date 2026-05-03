import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * POST /api/brics/prompt
 *
 * Accepts a BRIC id and a user prompt.
 * Returns an AI-generated programming suggestion that respects the BRIC's
 * pre-loaded rules, using the Anthropic Claude API when credentials are available.
 *
 * If ANTHROPIC_API_KEY is not configured, returns a rule-aware stub response so
 * the UI still functions in development/demo environments.
 */

const requestSchema = z.object({
  bricId: z.string().min(1).max(64),
  prompt: z.string().min(1).max(2000),
});

// Minimal metadata used to ground the AI response without importing the full
// GET handler (avoids circular imports in test environments).
const BRIC_CONTEXT: Record<string, { name: string; coreLaws: string[] }> = {
  spine: {
    name: 'Spine',
    coreLaws: [
      'Spine never stores PII, financial records, or customer data.',
      'All agent actions are validated against declared policy constraints.',
      'Every BRIC-to-BRIC call is authenticated; deny-by-default.',
    ],
  },
  'system-b': {
    name: 'System B',
    coreLaws: [
      'System B stores only assignment metadata; not NDAs or payment logs.',
      'Business-calling workflows are disabled until Compliance Agent signs off.',
      'All prices come from the backend pricing engine — no frontend hardcoding.',
    ],
  },
  'state-bric': {
    name: 'State BRIC',
    coreLaws: [
      'Each state owns its data exclusively; cross-state data flow is forbidden.',
      'Every micro-brick is SHA-256 hashed, Merkle-logged, and consensus-replicated.',
      'Financial history is append-only — never deleted.',
    ],
  },
  'owners-room': {
    name: "Owner's Room",
    coreLaws: [
      'Access requires MFA, VPN, and IP allowlist.',
      'Activating a new State BRIC requires dual-auth (owner + compliance agent).',
      'No bulk raw data export is permitted.',
    ],
  },
  'compliance-agent': {
    name: 'Compliance Agent',
    coreLaws: [
      'Public layer is read-only output; no inbound authenticated endpoints.',
      'Business workflows are disabled by default until a signed Compliance OK artifact exists.',
      'Compliance artifacts are signed with the compliance private key.',
    ],
  },
  'public-layer': {
    name: 'Public Layer',
    coreLaws: [
      'No sensitive data flows inward; intake routes to System B only.',
      'All dynamic content is sanitized before display (OWASP LLM Top 10).',
    ],
  },
};

function buildSystemPrompt(bricId: string): string {
  const ctx = BRIC_CONTEXT[bricId];
  if (!ctx) {
    return `You are a JGA Enterprise OS architecture assistant. Help the user configure BRICs safely.`;
  }

  return `You are a JGA Enterprise OS architecture assistant specializing in the "${ctx.name}" BRIC.

Pre-loaded rules for ${ctx.name} that must never be violated:
${ctx.coreLaws.map((l, i) => `${i + 1}. ${l}`).join('\n')}

When responding to user prompts:
- Provide concrete, actionable configuration steps or code snippets.
- Always validate suggestions against the above rules.
- Flag any proposed change that would violate a rule with a clear "⚠️ RULE VIOLATION:" warning.
- Keep responses concise and production-focused.`;
}

function buildStubResponse(bricId: string, prompt: string): string {
  const ctx = BRIC_CONTEXT[bricId];
  const bricName = ctx?.name ?? bricId;
  return `**[Demo Mode — Configure ANTHROPIC_API_KEY for live AI responses]**

**BRIC:** ${bricName}
**Prompt received:** "${prompt}"

**Suggested programming steps:**
1. Validate the prompt against ${bricName} pre-loaded rules.
2. Apply the change through the policy engine (\`policyEngine.validate(action, context)\`).
3. Log the mutation to the audit ledger with actor, resource, and rationale fields.
4. If the change touches financial or contract data, confirm Compliance Agent gate is open.

${
  ctx
    ? `**Active rules for ${bricName}:**\n${ctx.coreLaws.map((l) => `• ${l}`).join('\n')}`
    : ''
}`;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.errors },
      { status: 400 },
    );
  }

  const { bricId, prompt } = parsed.data;

  if (!BRIC_CONTEXT[bricId]) {
    return NextResponse.json({ error: `Unknown BRIC id: ${bricId}` }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Return a rule-aware stub so the UI works without credentials.
    return NextResponse.json(
      { bricId, response: buildStubResponse(bricId, prompt), demo: true },
      { status: 200 },
    );
  }

  try {
    // Lazy import so the module resolves at runtime when the key is present.
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    const message = await client.beta.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: buildSystemPrompt(bricId),
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    const responseText =
      textContent && textContent.type === 'text' ? textContent.text : 'No response generated.';

    return NextResponse.json({ bricId, response: responseText, demo: false }, { status: 200 });
  } catch (err) {
    console.error('[/api/brics/prompt] Anthropic API error:', err);
    // Fall back to stub rather than surfacing a 500 to the user.
    return NextResponse.json(
      { bricId, response: buildStubResponse(bricId, prompt), demo: true },
      { status: 200 },
    );
  }
}
