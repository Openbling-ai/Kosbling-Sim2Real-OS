import type { AppConfig } from "../config.js";
import type { CommerceWorldState } from "../domain.js";
import { getI18n } from "../i18n.js";
import { runPiToolSession, Type, type PiRuntimeContext, type ToolDefinition } from "./pi.js";
import type { ActionCapture, RawAction, RoleDescriptor, RolePlan } from "./contracts.js";

export class DomainRoleAgent {
  constructor(
    private readonly config: AppConfig,
    private readonly runtime: PiRuntimeContext,
    private readonly descriptor: RoleDescriptor,
  ) {}

  async proposeRoleActions(params: {
    state: CommerceWorldState;
    bossMessage: string;
    stageStartDay: number;
    stageEndDay: number;
  }): Promise<RolePlan> {
    const t = getI18n(this.config.locale);
    const capture: ActionCapture = { summary: "", watchouts: [], actions: [] };
    const actionSchema = Type.Object({
      summary: Type.String(),
      watchouts: Type.Optional(Type.Array(Type.String())),
      actions: Type.Array(
        Type.Object({
          action_type: Type.String(),
          domain: Type.String(),
          reason: Type.String(),
          risk_level: Type.String(),
          expected_effect: Type.Optional(Type.String()),
          payload: Type.Optional(Type.Record(Type.String(), Type.Any())),
        }),
      ),
    });
    const tools: ToolDefinition[] = [
      {
        name: "submit_role_actions",
        label: "submit_role_actions",
        description: `Submit the ${this.descriptor.label} role's proposed actions for this chunk.`,
        promptSnippet: "Use this to provide the role's compact structured action suggestions.",
        parameters: actionSchema,
        execute: async (_toolCallId, rawParams) => {
          const roleParams = rawParams as ActionCapture;
          capture.summary = roleParams.summary;
          capture.watchouts = roleParams.watchouts ?? [];
          capture.actions = roleParams.actions;
          return {
            content: [{ type: "text", text: "Role actions recorded." }],
            details: { count: roleParams.actions.length, role: this.descriptor.role },
          };
        },
      },
    ];

    const systemPrompt = buildRoleSystemPrompt({
      locale: this.config.locale,
      role: this.descriptor,
    });
    const userPrompt = [
      t.chunkWindow(params.stageStartDay, params.stageEndDay),
      t.bossMessageLabel(params.bossMessage),
      "",
      t.currentCompactState,
      JSON.stringify({
        day: params.state.meta.current_day,
        product: params.state.product,
        supply_chain: params.state.supply_chain,
        marketing: params.state.marketing,
        finance: params.state.finance,
        market_data: params.state.market_data,
      }, null, 2),
      "",
      this.config.locale.startsWith("zh")
        ? "请调用 submit_role_actions，给出这一角色对本阶段的建议。若该角色本轮不建议动作，也要给出简短摘要并传空数组。"
        : "Call submit_role_actions with this role's recommendations for the chunk. If the role recommends no action, still provide a short summary and an empty array.",
    ].join("\n");

    await runPiToolSession({
      config: this.config,
      runtime: this.runtime,
      systemPrompt,
      userPrompt,
      customTools: tools,
      capture,
      isCaptureReady: (value) => value.summary.length > 0,
    });

    return {
      role: this.descriptor.role,
      roleLabel: this.descriptor.label,
      summary: capture.summary || defaultRoleSummary(this.config.locale, this.descriptor),
      watchouts: capture.watchouts ?? [],
      actions: capture.actions.filter((action) => isRawActionForRole(action, this.descriptor)),
    };
  }
}

export function createDefaultRoleDescriptors(locale: string): RoleDescriptor[] {
  const zh = locale.startsWith("zh");
  return [
    {
      role: "marketing",
      label: zh ? "增长与投放" : "Growth and Paid Media",
      domainFocus: ["marketing", "brand"],
      actionFocus: ["set_channel_mix", "set_total_budget", "pause_ads", "launch_kol_campaign", "reuse_kol_creative", "start_promotion"],
      stance: zh
        ? "关注流量获取、渠道分配、创意疲劳与活动节奏。"
        : "Focus on traffic acquisition, channel mix, creative fatigue, and campaign timing.",
    },
    {
      role: "supply",
      label: zh ? "供应链运营" : "Supply Chain Ops",
      domainFocus: ["supply", "product"],
      actionFocus: ["reorder_inventory", "change_shipping_mode", "switch_sales_mode"],
      stance: zh
        ? "关注补货、在途库存、运输时效与缺货风险。"
        : "Focus on replenishment, inventory in transit, shipping timing, and stockout risk.",
    },
    {
      role: "finance",
      label: zh ? "财务护栏" : "Finance Guard",
      domainFocus: ["finance", "marketing"],
      actionFocus: ["set_cash_reserve", "set_total_budget", "pause_ads"],
      stance: zh
        ? "关注现金保护、预算纪律、利润压力与烧钱节奏。"
        : "Focus on cash protection, budget discipline, profit pressure, and burn rate.",
    },
    {
      role: "brand",
      label: zh ? "品牌与定价" : "Brand and Pricing",
      domainFocus: ["brand", "product", "marketing"],
      actionFocus: ["adjust_price", "reuse_kol_creative", "start_promotion", "launch_kol_campaign"],
      stance: zh
        ? "关注价格感知、品牌表达、内容调性与转化信任。"
        : "Focus on price perception, brand narrative, creative tone, and conversion trust.",
    },
  ];
}

function buildRoleSystemPrompt(params: {
  locale: string;
  role: RoleDescriptor;
}): string {
  const { locale, role } = params;
  const focus = role.actionFocus.join(", ");
  const domains = role.domainFocus.join(", ");
  if (locale.startsWith("zh")) {
    return [
      `你是 Kosbling 团队中的“${role.label}”角色。`,
      role.stance,
      `你主要关注这些 domain：${domains}。`,
      `你优先考虑这些 canonical action types：${focus}。`,
      "你不是 CEO，不需要统筹全局，只需要从自己的专业角度给出克制、可执行、最少量的建议。",
      "如果某件事超出你的职责，可以不提。",
      "除了 actions 之外，再给 CEO 0 到 3 条 watchouts，说明你最担心的约束、风险或需要其他角色配合的点。",
      "summary、reason、expected_effect 请使用简体中文。",
      "action_type、domain、risk_level 这些 canonical 字段必须保持英文，并使用系统允许的值。",
      "不要直接修改状态；只能通过 submit_role_actions 提交建议。",
    ].join("\n");
  }

  return [
    `You are the "${role.label}" role inside the Kosbling operating team.`,
    role.stance,
    `You primarily care about these domains: ${domains}.`,
    `Prioritize these canonical action types: ${focus}.`,
    "You are not the CEO. Do not coordinate the whole company; just provide disciplined specialist recommendations.",
    "If something is outside your role, you can ignore it.",
    "In addition to actions, give the CEO zero to three watchouts describing the most important constraints, risks, or cross-role dependencies you see.",
    "Write summary, reason, and expected_effect in English.",
    "Keep canonical action_type, domain, and risk_level values in English and within the allowed schema.",
    "Do not mutate state directly; only submit suggestions via submit_role_actions.",
  ].join("\n");
}

function defaultRoleSummary(locale: string, descriptor: RoleDescriptor): string {
  if (locale.startsWith("zh")) {
    return `${descriptor.label} 本轮没有建议新增动作。`;
  }
  return `${descriptor.label} recommended no new action for this chunk.`;
}

function isRawActionForRole(action: RawAction, descriptor: RoleDescriptor): boolean {
  return descriptor.domainFocus.includes(action.domain as never) || descriptor.actionFocus.includes(action.action_type);
}
