/**
 * BRICS Orchestrator
 * Factory and coordinator for all BRIC layers.
 *
 * Used by scripts (load-test, security-audit, go-live) to spin up
 * an in-process system graph for integration testing and auditing.
 */

import { join } from 'path'
import { Spine } from './spine/index'
import { PublicBric } from './public/index'
import { SystemBBric } from './system-b/index'
import { OwnersRoom } from './owners-room/index'
import { ComplianceAgent } from './spine/compliance-agent'

export interface BRICSConfig {
  baseDir: string
  stateCodes: string[]
  publicBaseUrl: string
  mfaRequired: boolean
  vpnRequired: boolean
}

export class BRICSOrchestrator {
  private spine: Spine
  private publicBric: PublicBric
  private systemB: SystemBBric
  private ownersRoom: OwnersRoom
  private compliance: ComplianceAgent

  constructor(config: BRICSConfig) {
    this.spine = new Spine({ baseDir: join(config.baseDir, 'spine') })
    this.publicBric = new PublicBric({
      baseDir: join(config.baseDir, 'public'),
      publicBaseUrl: config.publicBaseUrl,
    })
    this.systemB = new SystemBBric({ baseDir: join(config.baseDir, 'system-b') })
    this.ownersRoom = new OwnersRoom({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
    })
    this.compliance = new ComplianceAgent({ baseDir: join(config.baseDir, 'compliance') })
  }

  getSpine(): Spine {
    return this.spine
  }

  getPublicLayer(): PublicBric {
    return this.publicBric
  }

  getSystemB(): SystemBBric {
    return this.systemB
  }

  getOwnersRoom(): OwnersRoom {
    return this.ownersRoom
  }

  getCompliance(): ComplianceAgent {
    return this.compliance
  }

  async shutdown(): Promise<void> {
    // Graceful shutdown: flush in-memory buffers, etc.
    // No persistent connections to close in the current implementation.
  }
}

/**
 * Factory – creates and initialises a full BRICS graph.
 */
export async function createBRICS(config: BRICSConfig): Promise<BRICSOrchestrator> {
  const orchestrator = new BRICSOrchestrator(config)
  return orchestrator
}
