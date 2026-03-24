import type { KosblingDomain } from "../domain.js";

export type RawAction = {
  action_type: string;
  domain: string;
  reason: string;
  risk_level: string;
  expected_effect?: string;
  payload?: Record<string, unknown>;
};

export type RawHandoff = {
  to_role: string;
  note: string;
};

export type ActionCapture = {
  summary: string;
  watchouts?: string[];
  handoffs?: RawHandoff[];
  resolved_handoff_ids?: string[];
  actions: RawAction[];
};

export type RawEvent = {
  type: string;
  source: string;
  desc: string;
  severity: string;
  payload?: Record<string, unknown>;
};

export type EventCapture = {
  summary: string;
  events: RawEvent[];
};

export type TeamRole = "marketing" | "supply" | "finance" | "brand";

export interface RoleHandoff {
  handoffId: string;
  fromRole: TeamRole;
  toRole: TeamRole;
  note: string;
}

export interface PendingHandoff extends RoleHandoff {
  createdChunkNumber: number;
  createdStageStartDay: number;
  createdStageEndDay: number;
}

export interface HandoffStatus extends PendingHandoff {
  ageInChunks: number;
  priority: "normal" | "stale" | "critical";
  isStale: boolean;
}

export interface RolePlan {
  role: TeamRole;
  roleLabel: string;
  summary: string;
  watchouts: string[];
  handoffs: RoleHandoff[];
  resolvedHandoffIds: string[];
  actions: RawAction[];
}

export type RoleRunStatus = "success" | "failed";

export interface RoleRunRecord {
  role: TeamRole | "unknown";
  roleLabel: string;
  status: RoleRunStatus;
  summary: string;
  actionCount: number;
  watchoutCount: number;
  handoffCount: number;
  resolvedHandoffCount: number;
  errorMessage?: string;
}

export interface RoleDescriptor {
  role: TeamRole;
  label: string;
  domainFocus: KosblingDomain[];
  actionFocus: string[];
  stance: string;
}
