import type { KosblingDomain } from "../domain.js";

export type RawAction = {
  action_type: string;
  domain: string;
  reason: string;
  risk_level: string;
  expected_effect?: string;
  payload?: Record<string, unknown>;
};

export type ActionCapture = {
  summary: string;
  watchouts?: string[];
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

export interface RolePlan {
  role: TeamRole;
  roleLabel: string;
  summary: string;
  watchouts: string[];
  actions: RawAction[];
}

export interface RoleDescriptor {
  role: TeamRole;
  label: string;
  domainFocus: KosblingDomain[];
  actionFocus: string[];
  stance: string;
}
