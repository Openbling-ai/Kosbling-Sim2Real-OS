# Ice Bath NA v1 — Scenario Draft

Status: Draft v0.1  
Date: 2026-03-20  
Purpose: Phase 1 minimal runnable prototype scenario

---

## 关键假设说明

这个场景设计基于以下核心假设：

### 假设1：产品与市场匹配
- 便携冰浴桶在北美健身/恢复市场有真实需求
- TikTok是该品类的主要流量来源
- 目标用户是"对冷水浴好奇的健身爱好者"，而非专业运动员

### 假设2：保守的成本结构
- 单位成本（含运费）控制在$50以内
- 零售价$119，毛利率约58%（足够覆盖广告成本）
- 初始库存量保守（80单位），降低资金风险

### 假设3：广告效率假设
- TikTok广告CPM假设$8-12
- CTR假设1.5-2.5%
- CVR假设1.5-2.5%
- 这些数值是保守估计，基于同类产品经验

---

## 完整 YAML 草案

```yaml
# ============================================
# Ice Bath NA v1 — Minimal Runnable Scenario
# ============================================
# Purpose: Phase 1 prototype, 30-day shadow run
# Complexity: LOW — designed to be buildable in 2-3 weeks
# Agents: 3 roles only (Supplier, Ads, Finance)

# --------------------------------------------
# Identity
# --------------------------------------------
id: ice-bath-na-v1
name: Portable Ice Bath Tub — North America DTC
version: "0.1"
description: |
  Test whether a portable ice bath product can be launched profitably 
  with a $5000 budget in North America, using TikTok as the primary 
  acquisition channel. This is a minimal scenario designed to prove 
  the core simulation loop works.

# --------------------------------------------
# Business Definition
# --------------------------------------------
business:
  product_name: Portable Ice Bath Tub
  category: recovery_fitness
  target_customer: cold_plunge_curious_fitness_users
  market_region: north_america
  brand_positioning: minimal_premium
  # minimal_premium = accessible price point, clean aesthetic,
  # not competing on absolute cheapest, but not luxury either

# --------------------------------------------
# Simulation Settings
# --------------------------------------------
simulation:
  mode: shadow
  duration_days: 30
  random_seed: 42
  time_granularity: day
  # time_granularity = day means we simulate day-by-day
  # v0.1 does NOT need sub-day granularity

# --------------------------------------------
# Financial Constraints
# --------------------------------------------
budget:
  # Starting capital — conservative, enough for small test
  starting_cash_usd: 5000
  
  # Daily ad spend cap — prevents runaway spend
  max_daily_ad_spend_usd: 150
  
  # Cash floor — simulation should warn if we dip below this
  reserve_cash_floor_usd: 1000
  
  # Implicit: if cash falls below reserve, ads agent should pause

# --------------------------------------------
# Channel Configuration
# --------------------------------------------
channels:
  # Where traffic comes from
  acquisition:
    - tiktok
    # v0.1: SINGLE channel only, keep it simple
  
  # Where sales happen  
  storefront:
    - shopify
    # Abstracted — we don't need real Shopify integration for v0.1
  
  # How products reach customers
  fulfillment:
    - supplier_direct
    # supplier_direct = dropship from supplier to customer
    # No warehouse complexity for Phase 1

# --------------------------------------------
# Real-World Data Grounding
# --------------------------------------------
grounding:
  # Where to get supplier pricing/info
  supplier_sources:
    - alibaba
    # v0.1: can be mocked with realistic estimates
  
  # Where to validate demand signals
  trend_sources:
    - google_trends
    - tiktok_hashtags
    # v0.1: can be mocked or skipped
  
  # Where to validate pricing assumptions
  pricing_sources:
    - amazon
    - competitor_dtc_sites
    # v0.1: can be mocked

# --------------------------------------------
# Initial Assumptions — The Starting World
# --------------------------------------------
initial_assumptions:
  # --- Cost Structure ---
  # Unit cost from supplier (FOB or equivalent)
  unit_cost_usd: 35
  
  # Shipping cost per unit (supplier to customer)
  shipping_cost_usd: 15
  
  # Total landed cost per unit
  # Implicitly: $35 + $15 = $50
  
  # --- Pricing ---
  # Retail price to customer
  retail_price_usd: 119
  
  # Gross margin per unit: $119 - $50 = $69
  # Gross margin %: $69 / $119 ≈ 58%
  
  # --- Inventory ---
  # Starting inventory units
  initial_inventory_units: 80
  
  # When to trigger reorder
  reorder_point_units: 40
  
  # How much safety stock to maintain
  safety_stock_units: 60
  
  # --- Reorder Parameters ---
  # Units per reorder
  reorder_batch_units: 100
  
  # Days from order to delivery
  supplier_lead_time_days: 14

# --------------------------------------------
# Success Criteria — How We Judge the Run
# --------------------------------------------
success_criteria:
  # Minimum profit to consider this a "win"
  min_net_profit_usd: 1000
  
  # Minimum margin to consider unit economics viable
  min_margin_pct: 20
  
  # Maximum cash drawdown allowed
  # If we dip more than this, it's a "fail" even if profitable
  max_cash_drawdown_usd: 3500
  
  # Secondary criteria (for v0.1, these are informational)
  min_units_sold: 50
  max_stockout_days: 3

# --------------------------------------------
# Risk Model — What Can Go Wrong
# --------------------------------------------
risk_model:
  # Whether to inject chaos events
  chaos_enabled: true
  
  # Types of events that can occur
  allowed_event_types:
    - supplier_delay
    - cpm_spike
    - viral_demand_spike
    - stockout
    # v0.1: only these 4 types
  
  # Overall intensity (affects probability and severity)
  event_intensity: medium
  # low = rare events, mild impact
  # medium = occasional events, moderate impact
  # high = frequent events, severe impact
  
  # Event-specific probabilities (v0.1 can use defaults)
  event_probabilities:
    supplier_delay:
      probability: 0.1  # 10% chance per run
      max_delay_days: 7
    cpm_spike:
      probability: 0.15
      max_multiplier: 1.5  # CPM can spike 50%
    viral_demand_spike:
      probability: 0.05  # Rare but significant
      demand_multiplier: 3.0
    stockout:
      probability: 0.0  # Stockout is a CONSEQUENCE, not random event
      # Stockout happens if we run out of inventory

# --------------------------------------------
# Agent Configuration — Who Is Playing
# --------------------------------------------
agents:
  # Which agent roles are enabled for this scenario
  enabled_roles:
    - supplier
    - ads
    - finance
  # v0.1: Only 3 agents, keep it minimal
  
  # Agent-specific parameters
  agent_config:
    supplier:
      # How aggressive is restocking
      restock_policy: conservative
      # conservative = reorder early, prefer safety stock
      # aggressive = minimize inventory, risk stockouts
    
    ads:
      # Starting budget allocation
      initial_daily_budget_usd: 100
      # How quickly to scale spend on winners
      scale_up_factor: 1.2
      # How quickly to cut spend on losers
      scale_down_factor: 0.5
      # Minimum performance threshold to continue
      min_roas: 1.5
    
    finance:
      # Warning thresholds
      warn_cash_below_usd: 1500
      critical_cash_below_usd: 1000
      # What to do at critical level
      critical_action: pause_all_ads

# --------------------------------------------
# Output Requirements
# --------------------------------------------
outputs:
  # Generate human-readable audit log
  require_audit_log: true
  
  # Generate machine-readable summary
  require_summary_json: true
  
  # Where to store run artifacts
  run_directory: runs/ice-bath-na-v1

# --------------------------------------------
# Market Simulator Parameters (v0.1)
# --------------------------------------------
# These parameters drive the simulated market response
# They are SIMULATION parameters, not real-world inputs

market_simulator:
  # Base CPM (cost per 1000 impressions) for TikTok
  base_cpm_usd: 10
  
  # CTR assumptions
  base_ctr:
    min: 0.015  # 1.5%
    max: 0.025  # 2.5%
    # Actual CTR varies based on creative quality
  
  # CVR assumptions (click to purchase)
  base_cvr:
    min: 0.015  # 1.5%
    max: 0.025  # 2.5%
    # Actual CVR varies based on product-market fit
  
  # Creative quality multiplier
  # Affects CTR — better creatives = higher CTR
  creative_quality_levels:
    poor: 0.7
    average: 1.0
    good: 1.3
    excellent: 1.6
  
  # Price sensitivity
  # Higher prices reduce CVR
  price_elasticity:
    base_price: 119
    cvr_adjustment_per_10_usd: -0.002
    # For every $10 above base, CVR drops 0.2%

# --------------------------------------------
# v0.1 Scope Boundary
# --------------------------------------------
# What this scenario does NOT include:
# - Multi-SKU products
# - Influencer marketing
# - Email/CRM
# - Multiple acquisition channels
# - Detailed shipping geography
# - Tax calculations
# - Returns/refund workflows (beyond simple count)
# - Subscription/retention modeling
# - Live mode integration
# - Human approval workflows
# ============================================
```

---

## 设计决策说明

### 为什么选择这些参数？

#### 1. 起始资金 $5000
- 足够小批量测试，但不会太小导致无法运转
- 可以覆盖初始库存 + 2-3周广告预算
- 是真实DTC测试的合理金额

#### 2. 初始库存 80 单位
- 保守选择，降低资金风险
- 按预期销量（假设30-50单/月）足够支撑
- 留出学习空间，避免大量积压

#### 3. 零售价 $119
- 与市场同类产品一致（Amazon $99-149）
- 提供足够毛利覆盖广告成本
- 不追求最低价，但也不走高端路线

#### 4. 仅启用3个Agent
- Supplier：库存管理是DTC核心
- Ads：流量获取是成功关键
- Finance：资金监控是安全底线
- 其他Agent在Phase 2再加

#### 5. 事件概率偏低
- 目的是证明模拟可行，不是制造极端场景
- 保留少量事件以测试系统响应
- 可以通过调整random_seed重现或避免特定事件

---

## 验收标准

这个场景草案应该能让后续Codex：

1. **加载并解析** YAML结构
2. **初始化状态** 到state-model定义的格式
3. **运行30天** 简单的day-by-day循环
4. **生成输出** audit-log.md + summary.json
5. **判断胜负** 基于success_criteria

如果Codex能在2-3周内实现以上功能，Phase 1就算成功。

---

## 关键假设总结

### 假设1：TikTok广告效率
- 假设CPM $10、CTR 1.5-2.5%、CVR 1.5-2.5%
- 这决定CAC约 $20-40
- 如果实际CAC远高于此，模型会显示亏损

### 假设2：供应链稳定性
- 假设供应商能按时交货（lead time 14天）
- 即使有延迟，概率较低（10%）
- 如果供应链完全不可靠，再订货策略会失效

### 假设3：需求存在
- 假设市场对便携冰浴桶有真实需求
- 假设TikTok渠道能触达目标用户
- 如果产品本身无需求，任何广告预算都会浪费

---

## 最主要风险

### 风险：广告效率假设过于乐观

**描述：**
当前假设CAC $20-40，如果实际CAC超过 $60，即使转化也很难盈利（产品毛利仅$69/单位）。

**影响：**
- 模拟可能显示"盈利"，但真实世界会亏损
- 用户可能错误地认为这是一个好主意

**缓解：**
- Phase 1保持保守估计（CTR/CVR取低值）
- Phase 2引入更多市场数据校准
- 在audit log中明确标注假设敏感性

---

## 后续迭代方向

这个场景在后续Phase可以扩展：

1. **Phase 2：** 添加Marketing、Creative、Store agents
2. **Phase 3：** 接入真实TikTok API验证假设
3. **Phase 4：** Live Mode实验
4. **Phase 5：** 多场景对比、参数扫描

但v0.1的目标是**跑通最小循环**，不是完美预测。