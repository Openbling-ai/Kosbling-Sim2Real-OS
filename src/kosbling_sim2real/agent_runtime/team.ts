import type { ActionProposal, CommerceWorldState } from "../domain.js";
import type { AppConfig } from "../config.js";
import type { PiRuntimeContext } from "./pi.js";
import { CEOAgent } from "./ceo.js";
import { createDefaultRoleDescriptors, DomainRoleAgent } from "./domain-agent.js";
import type { HandoffStatus, RolePlan, RoleRunRecord, TeamRole } from "./contracts.js";

export interface RoleActionPlanner {
  proposeRoleActions(params: {
    state: CommerceWorldState;
    bossMessage: string;
    stageStartDay: number;
    stageEndDay: number;
    recentTeamMemory: string;
    openHandoffs: HandoffStatus[];
  }): Promise<RolePlan>;
}

export interface CeoActionCoordinator {
  mergeRolePlans(params: {
    state: CommerceWorldState;
    bossMessage: string;
    stageStartDay: number;
    stageEndDay: number;
    recentTeamMemory: string;
    openHandoffs: HandoffStatus[];
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
    recentTeamMemory: string;
    openHandoffs: HandoffStatus[];
    onRoleStart?: (role: { role: TeamRole; label: string }) => void;
    onRoleDone?: (plan: RolePlan) => void;
    onRoleError?: (role: { role: TeamRole | "unknown"; label: string }, error: Error) => void;
  }): Promise<{ summary: string; rationale: string; actions: ActionProposal[]; rolePlans: RolePlan[]; roleRuns: RoleRunRecord[] }> {
    const rolePlans: RolePlan[] = [];
    const roleRuns: RoleRunRecord[] = [];

    for (const roleAgent of this.roleAgents) {
      const descriptor = readRoleDescriptor(roleAgent);
      if (descriptor) {
        params.onRoleStart?.(descriptor);
      }
      try {
        const plan = await roleAgent.proposeRoleActions(params);
        params.onRoleDone?.(plan);
        const runRecord: RoleRunRecord = {
          role: plan.role,
          roleLabel: plan.roleLabel,
          status: "success",
          summary: plan.summary,
          actionCount: plan.actions.length,
          watchoutCount: plan.watchouts.length,
          handoffCount: plan.handoffs.length,
          resolvedHandoffCount: plan.resolvedHandoffIds.length,
        };
        roleRuns.push(runRecord);
        if (plan.summary.length > 0 || plan.actions.length > 0 || plan.watchouts.length > 0 || plan.handoffs.length > 0 || plan.resolvedHandoffIds.length > 0) {
          rolePlans.push(plan);
        }
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        const failedRole = descriptor ?? fallbackRoleDescriptor(roleAgent);
        params.onRoleError?.(failedRole, normalizedError);
        roleRuns.push({
          role: failedRole.role,
          roleLabel: descriptor?.label ?? "Unknown role",
          status: "failed",
          summary: "",
          actionCount: 0,
          watchoutCount: 0,
          handoffCount: 0,
          resolvedHandoffCount: 0,
          errorMessage: normalizedError.message,
        });
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
      roleRuns,
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

function readRoleDescriptor(roleAgent: RoleActionPlanner): { role: TeamRole; label: string } | null {
  if (!("descriptor" in (roleAgent as object))) {
    return null;
  }

  const descriptor = (roleAgent as { descriptor?: { role?: TeamRole; label?: string } }).descriptor;
  if (!descriptor?.role || !descriptor?.label) {
    return null;
  }

  return {
    role: descriptor.role,
    label: descriptor.label,
  };
}

function fallbackRoleDescriptor(roleAgent: RoleActionPlanner): { role: TeamRole | "unknown"; label: string } {
  const descriptor = readRoleDescriptor(roleAgent);
  return descriptor ?? { role: "unknown", label: "Unknown role" };
}
