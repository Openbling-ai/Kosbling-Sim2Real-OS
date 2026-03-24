import type { ActionProposal, CommerceWorldState } from "../domain.js";
import type { AppConfig } from "../config.js";
import type { PiRuntimeContext } from "./pi.js";
import { CEOAgent } from "./ceo.js";
import { createDefaultRoleDescriptors, DomainRoleAgent } from "./domain-agent.js";
import type { RolePlan } from "./contracts.js";

export interface RoleActionPlanner {
  proposeRoleActions(params: {
    state: CommerceWorldState;
    bossMessage: string;
    stageStartDay: number;
    stageEndDay: number;
  }): Promise<RolePlan>;
}

export interface CeoActionCoordinator {
  mergeRolePlans(params: {
    state: CommerceWorldState;
    bossMessage: string;
    stageStartDay: number;
    stageEndDay: number;
    rolePlans: RolePlan[];
  }): Promise<{ summary: string; rationale: string; actions: ActionProposal[] }>;
}

export class MultiAgentActionOrchestrator {
  constructor(
    private readonly ceo: CeoActionCoordinator,
    private readonly roleAgents: RoleActionPlanner[],
  ) {}

  async proposeActions(params: {
    state: CommerceWorldState;
    bossMessage: string;
    stageStartDay: number;
    stageEndDay: number;
  }): Promise<{ summary: string; rationale: string; actions: ActionProposal[]; rolePlans: RolePlan[] }> {
    const rolePlans: RolePlan[] = [];

    for (const roleAgent of this.roleAgents) {
      const plan = await roleAgent.proposeRoleActions(params);
      if (plan.summary.length > 0 || plan.actions.length > 0) {
        rolePlans.push(plan);
      }
    }

    const merged = await this.ceo.mergeRolePlans({
      ...params,
      rolePlans,
    });

    return {
      summary: merged.summary,
      rationale: merged.rationale,
      actions: merged.actions,
      rolePlans,
    };
  }
}

export function createDefaultActionOrchestrator(config: AppConfig, runtime: PiRuntimeContext): {
  ceo: CEOAgent;
  orchestrator: MultiAgentActionOrchestrator;
} {
  const ceo = new CEOAgent(config, runtime);
  const roleAgents = createDefaultRoleDescriptors(config.locale).map(
    (descriptor) => new DomainRoleAgent(config, runtime, descriptor),
  );

  return {
    ceo,
    orchestrator: new MultiAgentActionOrchestrator(ceo, roleAgents),
  };
}
