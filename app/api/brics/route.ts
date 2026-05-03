import { NextResponse } from 'next/server';

/**
 * Programming BRICs — pre-loaded definitions with embedded system law rules.
 *
 * Each BRIC is a self-contained operational module. Rules are loaded from the
 * Spine's 8 System Laws plus module-specific constraints.
 *
 * GET /api/brics
 */

export interface BricRule {
  id: string;
  title: string;
  description: string;
  enforcedAt: 'network' | 'schema' | 'code' | 'audit';
}

export interface ProgrammingBric {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Pre-loaded system-law and module rules */
  rules: BricRule[];
  /** Optional AI prompt seed that pre-fills the programming interface */
  promptSeed: string;
}

const PROGRAMMING_BRICS: ProgrammingBric[] = [
  {
    id: 'spine',
    name: 'Spine',
    description: 'Core strategy, AI policy enforcement, and system law governance.',
    icon: '🧠',
    rules: [
      {
        id: 'law-2',
        title: 'No Customer Data Storage',
        description: 'Spine never stores PII, financial records, NDAs, or project files.',
        enforcedAt: 'schema',
      },
      {
        id: 'law-8',
        title: 'No Implicit Network Trust',
        description: 'Every BRIC-to-BRIC call is authenticated and authorized; deny-by-default.',
        enforcedAt: 'network',
      },
      {
        id: 'spine-ai-1',
        title: 'AI Constraint Enforcement',
        description: 'All agent actions are validated against declared policy constraints before execution.',
        enforcedAt: 'code',
      },
    ],
    promptSeed: 'Configure Spine to enforce policy rule: ',
  },
  {
    id: 'system-b',
    name: 'System B',
    description: 'Operational engine for onboarding, project routing, and pricing confirmations.',
    icon: '⚙️',
    rules: [
      {
        id: 'law-3',
        title: 'No Bulk Sensitive Storage',
        description: 'System B stores only assignment metadata; never NDAs, payment logs, or project files.',
        enforcedAt: 'schema',
      },
      {
        id: 'law-6',
        title: 'Compliance Gate First',
        description: 'Business-calling workflows are disabled by default; enabled only after compliance sign-off.',
        enforcedAt: 'code',
      },
      {
        id: 'sb-pricing-1',
        title: 'No Frontend Hardcoded Pricing',
        description: 'All prices are calculated by the backend pricing engine; the frontend always calls /api/pricing.',
        enforcedAt: 'code',
      },
    ],
    promptSeed: 'Program System B to route: ',
  },
  {
    id: 'state-bric',
    name: 'State BRIC',
    description: 'Fully isolated per-state data engine with Stitch Brick integrity and consensus replication.',
    icon: '🏛️',
    rules: [
      {
        id: 'law-4',
        title: 'Full State Isolation',
        description: 'Each state owns its data exclusively; cross-state data flow is architecturally forbidden.',
        enforcedAt: 'network',
      },
      {
        id: 'law-7',
        title: 'Stitch Brick Integrity',
        description: 'Every micro-brick is SHA-256 hashed, Merkle-logged, and consensus-replicated. Mismatch = auto-heal.',
        enforcedAt: 'code',
      },
      {
        id: 'state-audit-1',
        title: 'Append-Only Ledger',
        description: 'Financial and compliance history is never deleted; all mutations produce audit events.',
        enforcedAt: 'audit',
      },
    ],
    promptSeed: 'Activate state BRIC for state tag: ',
  },
  {
    id: 'owners-room',
    name: "Owner's Room",
    description: 'MFA-protected lifecycle management and strategic oversight control plane.',
    icon: '🔐',
    rules: [
      {
        id: 'law-5',
        title: 'Restricted Access',
        description: 'Owners Room requires MFA (hardware token), VPN, and IP allowlist. No bulk data export.',
        enforcedAt: 'code',
      },
      {
        id: 'or-dual-auth-1',
        title: 'Dual Auth for BRIC Activation',
        description: 'Activating a new State BRIC requires dual-auth (owner + compliance agent signature).',
        enforcedAt: 'code',
      },
    ],
    promptSeed: 'Configure Owners Room policy for: ',
  },
  {
    id: 'compliance-agent',
    name: 'Compliance Agent',
    description: 'Ingests regulations, runs compliance tests, signs artifacts, and manages the business-call gate.',
    icon: '✅',
    rules: [
      {
        id: 'law-1',
        title: 'Unidirectional Public Boundary',
        description: 'Public layer is read-only output; no inbound authenticated endpoints are internet-reachable.',
        enforcedAt: 'network',
      },
      {
        id: 'law-6',
        title: 'Compliance Gate Precedes Business Calls',
        description: 'Outbound business workflows are disabled until a signed Compliance OK artifact exists.',
        enforcedAt: 'code',
      },
      {
        id: 'ca-artifact-1',
        title: 'Signed Compliance Artifacts',
        description: 'Compliance artifacts are signed with the compliance private key; any alteration invalidates them.',
        enforcedAt: 'audit',
      },
    ],
    promptSeed: 'Run compliance check for: ',
  },
  {
    id: 'public-layer',
    name: 'Public Layer',
    description: 'Marketing and intake entry-point — sanitized, read-only output served from approved sources.',
    icon: '🌐',
    rules: [
      {
        id: 'law-1',
        title: 'Output-Only Boundary',
        description: 'No sensitive data flows inward through the public layer; intake routes to System B only.',
        enforcedAt: 'network',
      },
      {
        id: 'pl-xss-1',
        title: 'Output Sanitization',
        description: 'All dynamic content rendered in the public layer is sanitized before display (OWASP LLM Top 10).',
        enforcedAt: 'code',
      },
    ],
    promptSeed: 'Customize public layer content for: ',
  },
];

export async function GET() {
  return NextResponse.json({ brics: PROGRAMMING_BRICS }, { status: 200 });
}
