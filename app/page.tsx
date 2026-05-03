'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Types (mirror of /api/brics) ────────────────────────────────────────────

interface BricRule {
  id: string;
  title: string;
  description: string;
  enforcedAt: string;
}

interface ProgrammingBric {
  id: string;
  name: string;
  description: string;
  icon: string;
  rules: BricRule[];
  promptSeed: string;
}

// ─── Enforcement badge colours ────────────────────────────────────────────────

const ENFORCE_COLOURS: Record<string, string> = {
  network: 'bg-blue-900 text-blue-200 border border-blue-700',
  schema: 'bg-purple-900 text-purple-200 border border-purple-700',
  code: 'bg-yellow-900 text-yellow-200 border border-yellow-700',
  audit: 'bg-green-900 text-green-200 border border-green-700',
};

// ─── Single BRIC card ─────────────────────────────────────────────────────────

function BricCard({ bric }: { bric: ProgrammingBric }) {
  const [prompt, setPrompt] = useState(bric.promptSeed);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/brics/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bricId: bric.id, prompt }),
      });
      const data = (await res.json()) as { response: string; demo?: boolean };
      setResult(data.response);
      setIsDemo(data.demo ?? false);
    } catch {
      setResult('⚠️ Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="flex flex-col bg-neutral-900 border border-yellow-700/40 rounded-xl overflow-hidden shadow-lg hover:border-yellow-500/60 transition-colors">
      {/* Card header */}
      <header className="px-5 pt-5 pb-4 border-b border-yellow-700/20">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl" role="img" aria-label={bric.name}>
            {bric.icon}
          </span>
          <h3 className="text-lg font-bold text-yellow-400 tracking-wide">{bric.name}</h3>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed">{bric.description}</p>
      </header>

      {/* Pre-loaded rules */}
      <div className="px-5 py-4 flex-1">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold text-yellow-600 uppercase tracking-widest mb-3 hover:text-yellow-400 transition-colors"
        >
          <span>{expanded ? '▾' : '▸'}</span>
          Pre-loaded Rules ({bric.rules.length})
        </button>

        {expanded && (
          <ul className="space-y-3">
            {bric.rules.map((rule) => (
              <li key={rule.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{rule.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${ENFORCE_COLOURS[rule.enforcedAt] ?? 'bg-neutral-700 text-neutral-300'}`}
                  >
                    {rule.enforcedAt}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-snug">{rule.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Prompt programming interface */}
      <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
        <label
          htmlFor={`prompt-${bric.id}`}
          className="block text-xs font-semibold text-yellow-600 uppercase tracking-widest"
        >
          Program by Prompt
        </label>
        <textarea
          id={`prompt-${bric.id}`}
          ref={textareaRef}
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={bric.promptSeed}
          className="w-full rounded-lg bg-black border border-yellow-700/50 text-sm text-neutral-200 placeholder-neutral-600 px-3 py-2 focus:outline-none focus:border-yellow-500 resize-none font-mono"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full py-2 rounded-lg text-sm font-bold tracking-wide bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing…' : 'Run Prompt →'}
        </button>

        {result && (
          <div
            className={`rounded-lg p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed border ${
              isDemo
                ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                : 'bg-green-950 border-green-800 text-green-200'
            }`}
          >
            {isDemo && (
              <p className="mb-2 text-yellow-500 font-sans font-semibold not-italic">
                ⚡ Demo mode — add ANTHROPIC_API_KEY for live AI
              </p>
            )}
            {result}
          </div>
        )}
      </form>
    </article>
  );
}

// ─── Programming BRICs section ────────────────────────────────────────────────

function ProgrammingBricsSection() {
  const [brics, setBrics] = useState<ProgrammingBric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/brics')
      .then((r) => r.json())
      .then((data: { brics: ProgrammingBric[] }) => setBrics(data.brics))
      .catch(() => setError('Failed to load BRICs.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="brics" className="w-full max-w-6xl mx-auto px-4 py-20">
      {/* Section heading */}
      <div className="text-center mb-12">
        <p className="text-xs font-bold tracking-[0.3em] text-yellow-500 uppercase mb-3">
          Sovereign Architecture
        </p>
        <h2 className="text-4xl font-extrabold text-white mb-4">Programming BRICs</h2>
        <p className="text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
          Each BRIC is a pre-wired operational module loaded with its System Law rules. Select a
          BRIC and program it by natural-language prompt — the AI respects every constraint.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {[
          { label: 'network', colour: ENFORCE_COLOURS.network },
          { label: 'schema', colour: ENFORCE_COLOURS.schema },
          { label: 'code', colour: ENFORCE_COLOURS.code },
          { label: 'audit', colour: ENFORCE_COLOURS.audit },
        ].map(({ label, colour }) => (
          <span key={label} className={`text-[10px] px-2 py-1 rounded font-mono ${colour}`}>
            {label}
          </span>
        ))}
        <span className="text-[10px] text-neutral-600 self-center ml-1">— enforcement layer</span>
      </div>

      {/* Grid */}
      {loading && (
        <p className="text-center text-neutral-500 text-sm">Loading BRICs…</p>
      )}
      {error && (
        <p className="text-center text-red-400 text-sm">{error}</p>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brics.map((bric) => (
            <BricCard key={bric.id} bric={bric} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Landing page ─────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-gradient-to-b from-neutral-950 to-black border-b border-yellow-700/20">
        <p className="text-xs font-bold tracking-[0.3em] text-yellow-500 uppercase mb-4">
          Jay&apos;s Graphic Arts LLC
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
          JGA Enterprise OS
        </h1>
        <p className="text-lg text-neutral-400 mb-10 max-w-lg leading-relaxed">
          Enterprise Operating System with 8 System Laws for secure, compliant, and scalable
          business operations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a
            href="/login"
            className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="border border-yellow-500 text-yellow-400 px-8 py-3 rounded-lg font-bold hover:bg-yellow-500/10 transition"
          >
            Get Started
          </a>
          <a
            href="#brics"
            className="border border-neutral-700 text-neutral-400 px-8 py-3 rounded-lg font-bold hover:border-yellow-700/50 hover:text-neutral-300 transition"
          >
            Explore BRICs ↓
          </a>
        </div>

        {/* System law pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full">
          <div className="bg-neutral-900 border border-yellow-700/30 p-5 rounded-xl">
            <h3 className="text-base font-bold text-yellow-400 mb-1">Secure</h3>
            <p className="text-sm text-neutral-400">End-to-end encryption, mTLS, MFA enforcement</p>
          </div>
          <div className="bg-neutral-900 border border-yellow-700/30 p-5 rounded-xl">
            <h3 className="text-base font-bold text-yellow-400 mb-1">Compliant</h3>
            <p className="text-sm text-neutral-400">8 system laws, dual-auth, append-only audit trail</p>
          </div>
          <div className="bg-neutral-900 border border-yellow-700/30 p-5 rounded-xl">
            <h3 className="text-base font-bold text-yellow-400 mb-1">Scalable</h3>
            <p className="text-sm text-neutral-400">State-isolated BRICs, event-driven architecture</p>
          </div>
        </div>
      </section>

      {/* ── Programming BRICs ─────────────────────────────────────────── */}
      <div className="bg-neutral-950">
        <ProgrammingBricsSection />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-yellow-700/20 py-8 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} Jay&apos;s Graphic Arts LLC — JGA Enterprise OS
      </footer>
    </main>
  );
}
