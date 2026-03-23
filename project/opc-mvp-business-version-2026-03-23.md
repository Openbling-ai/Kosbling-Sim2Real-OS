# Kosbling：OPC 个人电商工作室模拟器

> **"你口袋里的AI电商工作室——说一句话，4个Agent帮你从选品到出单。先模拟，跑通再花真钱。"**
>
> 架构参考：[Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) 48-agent框架模式
> 适配场景：DTC电商经营模拟 + OpenClaw IM-Native 交互

---

## 一、产品定义

用户在 OpenClaw 连接的任意 IM（微信/飞书/Slack/Telegram/WhatsApp/Discord）中对话。感受是：**雇了一个4人AI电商团队，住在你的聊天窗口里。** 你是老板，随时下指令，每个决策实时影响30天模拟结果。所有预测锚定 Google Trends 真实数据。

跑通后一键切换 Live Mode，同一套 Agent 操作真实 Shopify/Meta Ads。

---

## 二、Agent 架构（4工种 + 1主控）

参照 Claude-Code-Game-Studios 的三层Agent架构 + 明确职能边界 + 委派地图模式：

```
┌──────────────────────────────────────────────────────────┐
│ OPC 电商工作室 Agent 架构 │
│ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🧠 Kos — 主控 CEO Agent │ │
│ │ 角色：老板的对话窗口，团队总协调 │ │
│ │ 职责：意图解析、状态管理、调度子Agent、汇报 │ │
│ │ 模型：opus │ │
│ │ 工具：全部 │ │
│ └──────┬──────────┬──────────┬─────────┬──────┘ │
│ │ │ │ │ │
│ ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐ │
│ │ 📦 │ │ 📢 │ │ 🎨 │ │ 💰 │ │
│ │供应链 │ │社交媒体 │ │品牌PR │ │财务 │ │
│ │运营 │ │营销增长 │ │ │ │ │ │
│ └────────┘ └────────┘ └────────┘ └────────┘ │
│ │
│ 每个Agent定义包含（同Game Studios模式）： │
│ ✅ 角色说明 + 职责清单 │
│ ✅ "绝对不能做"的边界 │
│ ✅ 委派地图（谁向谁汇报、谁向谁求助） │
│ ✅ 可用工具列表 │
│ ✅ 模型等级 │
└──────────────────────────────────────────────────────────┘
```

---

### 🧠 Kos — 主控 CEO Agent

```yaml
name: kos-ceo
description: "OPC电商工作室主控，协调全团队，与老板（用户）直接对话"
model: opus
tools: [Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, Task]
```

**职责：**
1. 解析用户自然语言意图，路由到对应 Agent
2. 管理模拟状态（SimState JSON），持久化到文件
3. 推进模拟时间线（每5天一个阶段）
4. 汇总各 Agent 报告，生成用户可读的 IM 消息
5. 在 Agent 之间有分歧时协调或上报用户决策
6. 触发随机事件（基于 Google Trends 数据变化）

**绝对不能做：**
- 不自己计算财务数字（交给财务 Agent）
- 不自己决定投放策略（交给社交媒体营销增长 Agent）
- 不在用户没说"继续"时自动推进模拟
- 不编造 Google Trends 数据

**委派地图：**
```
向上：直接对用户（老板）汇报
向下：调度 📦供应链 / 📢社交媒体营销增长 / 🎨品牌PR / 💰财务
横向：无（唯一的顶层Agent）
```

---

### 📦 供应链运营 Agent — Supply Chain Ops

```yaml
name: supply-chain-ops
description: "管采购、库存、物流、供应商、仓储、发货"
model: sonnet
tools: [Read, Write, Bash, Glob, Grep]
```

**职责：**
1. 查询/估算供应商报价（1688/Alibaba价格）
2. 管理库存水位：安全线预警、补货建议
3. 计算物流方案：海运/空运/混合/本地代发
4. 处理退换货/补发逻辑
5. 评估新SKU的供应链可行性
6. 订单履约状态跟踪

**可执行的用户指令：**
```
"加大采购量到200件" → 重算成本（量大折扣）+ 更新库存预测
"换一个更便宜的供应商" → 对比3家报价，推荐最优
"海运太慢，前50件走空运" → 混合物流策略，重算成本和时间
"找一个美国本土代发仓" → 切Dropshipping模式，成本结构全变
"暂停补货，先清库存" → 停止采购，只做销售
"加一个SKU卖浴袍" → 评估新品供应链，新增产品线
"这批货包装换简装" → 降低包材成本，影响毛利
```

**绝对不能做：**
- 不做营销决策（渠道选择/预算分配是社交媒体营销的事）
- 不做定价决策（价格调整是财务的事）
- 不直接跟用户对话（通过Kos汇报）

**委派地图：**
```
向上：向 🧠Kos 汇报
向下：无
横向：与 💰财务 协商采购预算，与 📢社交媒体营销 同步库存水位
```

---

### 📢 社交媒体营销增长 Agent — Social Media & Growth

```yaml
name: social-media-growth
description: "统管社交媒体运营、达人合作、内容创作、效果广告投放、增长策略"
model: sonnet
tools: [Read, Write, Bash, Glob, Grep]
```

**核心理念：社交媒体运营、KOL/达人合作、广告投放是一个完整的增长引擎，不是三个独立工种。**

```
 📢 社交媒体营销增长
 ┌──────────────────┐
 │ │
 ┌────────┼────────┬─────────┘
 │ │ │
 ▼ ▼ ▼
 ┌────────┐┌────────┐┌────────┐
 │ 内容 ││ 达人 ││ 效果 │
 │ 运营 ││ 合作 ││ 广告 │
 │ ││ ││ 投放 │
 └───┬────┘└───┬────┘└───┬────┘
 │ │ │
 └─────────┼─────────┘
 │
 素材在三者之间流转：
 达人素材 → 混剪为广告素材
 官方素材 → 社媒发布 + 广告投放
 UGC素材 → 社媒+广告复用
```

**三个子能力域：**

#### A. 社交媒体内容运营（Organic Social）

| 能力 | 说明 |
|------|------|
| 内容日历规划 | 根据品类和节日制定每周发布计划 |
| 官方素材创作 | 产品图/视频脚本/文案方向建议 |
| 平台选择 | TikTok/Instagram/YouTube/Pinterest/X 哪个优先 |
| 内容类型策略 | 教程/测评/幕后/UGC合集/趋势蹭热点 |
| 社区互动模拟 | 模拟评论区互动、粉丝增长曲线 |

#### B. 达人/KOL 合作（Influencer/Creator）

| 能力 | 说明 |
|------|------|
| 达人筛选 | 按品类/粉丝量/互动率/报价推荐匹配达人 |
| 合作模式 | 付费合作/寄样测评/联盟佣金/长期签约 |
| 内容方向指导 | 给达人的Brief建议（卖点+风格+CTA） |
| 效果追踪 | 每个达人带来多少曝光/点击/转化 |
| **素材二次利用** | 达人视频混剪为广告素材（核心联动点） |

#### C. 效果广告投放（Paid Ads）

| 能力 | 说明 |
|------|------|
| 渠道管理 | Facebook/TikTok/Google/Pinterest Ads |
| 预算分配 | 各渠道预算占比 + 日预算 + 总预算控制 |
| 受众定向 | 基于品类和市场选择投放人群 |
| 素材管理 | 官方素材/达人素材/UGC混剪/A-B测试 |
| 数据优化 | CPC/CTR/ROAS实时监控 + 自动优化建议 |
| 促销活动 | 限时折扣/节日Campaign/Flash Sale |

**素材流转规则（核心联动）：**
```
素材来源 可用于 效果差异
─────────────────────────────────────────────────────
官方产品图/视频 → 社媒发布 + 广告投放 CTR中等，品牌感强
达人原创视频 → 达人自己渠道发布 信任感高，转化好
达人视频混剪 → 广告投放（效果广告素材） CTR高+转化高（最佳）
用户UGC → 社媒转发 + 广告投放 真实感最强
官方+达人混剪 → 广告批量投放 规模化最佳素材
```

**不同品类的营销策略模板：**
```
品类 主渠道 达人策略 广告策略
───────────────────────────────────────────────────────
美妆个护 TikTok+IG 美妆博主测评 短视频+UGC广告
户外运动 TikTok+YT 户外/健身达人 场景展示广告
家居好物 Pinterest+IG 家居博主+生活方式 轮播图+视频广告
3C电子 YouTube+Reddit 科技测评达人 搜索广告+视频
宠物用品 TikTok+IG 萌宠账号植入 情感化短视频广告
食品保健 IG+TikTok 营养师/健身达人 证言式广告
```

**可执行的用户指令：**
```
# 渠道与预算
"换TikTok投，FB太贵了" → 切换主投放渠道，CPC/CTR参数全变
"预算翻倍，日投$100" → 调整日预算，模拟更大流量
"广告暂停3天，ROI太差了" → 暂停投放，观察自然流量
"FB和TikTok各50%测试" → A/B双渠道并行

# 达人合作
"找几个TikTok达人帮我带货" → 推荐匹配达人列表+报价
"给达人寄样品，不付费合作" → 低成本但不确定的模拟
"搞联盟营销，给10%佣金" → 长尾分佣模式
"把达人视频剪一版做广告素材" → 混剪素材投放，通常CTR最高

# 内容策略
"素材换成极简高端风格" → 创意方向调整，CTR变化
"做一波圣诞节Campaign" → 季节性策略，预算前置+节日素材
"多发点UGC风格的内容" → 社媒内容方向调整
"每天发一条TikTok" → 内容频率提升，自然流量增长

# 促销活动
"降价到$89做3天促销" → 短期降价→转化升但利润降
"搞买一送一活动" → 清库存策略
"做一个限时闪购" → 紧迫感营销
```

**绝对不能做：**
- 不做采购/供应链决策（库存是供应链Agent的事）
- 不做品牌战略层决策（品牌定位/视觉是品牌PR的事）
- 不直接修改产品定价（价格是财务Agent的事）

**委派地图：**
```
向上：向 🧠Kos 汇报
向下：无
横向：从 📦供应链 获取库存水位（库存紧张时自动减预算）
 从 🎨品牌PR 获取品牌视觉规范（确保广告素材on-brand）
 向 💰财务 同步广告花费（实时更新P&L）
```

---

### 🎨 品牌 PR Agent — Brand & PR

```yaml
name: brand-pr
description: "品牌视觉、公关媒体、品牌合作、品牌活动策划"
model: sonnet
tools: [Read, Write, Glob, Grep]
```

**与社交媒体营销增长的区别：**
```
📢 社交媒体营销增长 = 短期ROI驱动
 "这条广告花了$50，赚了$150"

🎨 品牌PR = 长期品牌资产建设
 "这次媒体报道让品牌认知度提升了，但无法直接算ROI"
```

**职责：**
1. 品牌视觉方向（色调、风格、调性定义）
2. 品牌故事/品牌宣言撰写
3. 媒体关系管理（PR稿、媒体合作模拟）
4. 品牌联名/跨界合作策划
5. 品牌活动（快闪、线下体验、社区活动）
6. 包装和开箱体验设计方向
7. 品牌一致性审核（确保所有对外内容on-brand）

**可执行的用户指令：**
```
"我想做高端品牌感" → 输出品牌视觉方向+调性建议
"策划一次PR活动" → 设计品牌活动方案+预算+预期效果
"找媒体做一次报道" → 模拟PR传播效果+费用
"设计一个限定联名包装" → 品牌联名策划+成本评估
"品牌slogan帮我想几个" → 品牌文案方向
```

**绝对不能做：**
- 不做效果广告投放（那是社交媒体营销增长的事）
- 不做日常社媒内容发布（那也是社交媒体营销增长的事）
- 不做采购/库存决策

**委派地图：**
```
向上：向 🧠Kos 汇报
向下：无
横向：向 📢社交媒体营销增长 提供品牌视觉规范
 与 📦供应链 协调包装设计
```

---

### 💰 财务 Agent — Finance Guard

```yaml
name: finance-guard
description: "管钱、算账、控风险、出报表"
model: sonnet
tools: [Read, Write, Bash, Glob, Grep]
```

**职责：**
1. 维护实时 P&L（收入/成本/利润每天更新）
2. 现金流监控 + 余额预警
3. 定价策略评估（涨价/降价/促销的财务影响）
4. 投入产出分析（CAC/LTV/ROAS/毛利率）
5. 预算分配建议（广告/采购/KOL各占多少）
6. 财务风险预警（烧钱速度/破产倒计时）
7. 结算报告生成（30天终局P&L）

**可执行的用户指令：**
```
"涨价到$139" → 计算对转化/利润的综合影响
"我还剩多少钱？" → 输出详细余额+支出明细
"这个月能赚多少？" → 基于当前趋势的利润预测
"留$2000做现金储备不能动" → 锁定储备金，可用预算减少
"开通分期付款" → 转化率+15%但有坏账风险
"复盘一下，哪个决策最亏？" → 回溯分析每个决策的ROI
"如果当时没空运会怎样？" → 平行宇宙模拟
```

**绝对不能做：**
- 不做营销决策（渠道/素材方向是社交媒体营销的事）
- 不做采购决策（下单/换供应商是供应链的事）
- 不做品牌决策

**委派地图：**
```
向上：向 🧠Kos 汇报
向下：无
横向：从 📢社交媒体营销增长 接收广告花费数据
 从 📦供应链 接收采购成本数据
 向 🧠Kos 发出财务预警
```

---

## 三、Agent 协作规则

参照 Claude-Code-Game-Studios 的 5 条协作规则，适配电商场景：

```
规则1：垂直委派
 Kos → 各Agent。各Agent不跳过Kos直接对用户说话。

规则2：横向协商
 供应链Agent发现库存不足 → 通知社交媒体营销增长（可能要降投放）
 社交媒体营销增长发现ROAS极好 → 通知财务（建议追加预算）
 但横向协商不能做跨域决策——需要Kos协调或用户裁决。

规则3：冲突上报
 供应链说"该备货" + 财务说"没预算" → 上报Kos → Kos问用户裁决
 社交媒体营销增长说"加预算" + 财务说"ROI还没验证" → 上报Kos

规则4：变更传播
 用户换品 → Kos通知所有Agent重置
 用户改价 → Kos通知财务重算 + 社交媒体营销增长评估转化影响

规则5：不越界
 每个Agent只修改自己域内的状态。供应链不改广告参数，投放不改库存。
```

---

## 四、模拟状态结构（SimState）

```python
SimState = {
 "meta": {
 "user_id": "user_123",
 "session_id": "sim_abc",
 "current_day": 15,
 "status": "running", # running | paused | completed
 "seed": 1234567,
 },

 # ===== 产品 =====
 "product": {
 "name": "Portable Ice Bath Tub",
 "category": "outdoor_fitness",
 "price": 129,
 "unit_cost": 34,
 "shipping_cost_sea": 12,
 "shipping_cost_air": 38,
 "mode": "normal", # normal | presale | clearance
 "additional_skus": [],
 },

 # ===== 供应链 =====
 "supply_chain": {
 "supplier": {"name": "1688供应商A", "moq": 50, "unit_price": 34},
 "inventory": {"in_stock": 62, "in_transit_sea": 100, "in_transit_air": 0},
 "fulfillment": "self_ship", # self_ship | dropship | 3pl
 "sea_arrival_day": 23,
 "reorder_point": 20,
 },

 # ===== 社交媒体营销增长 =====
 "marketing": {
 "channels": {
 "tiktok": {
 "budget_pct": 0.8, "daily_budget": 64,
 "cpc": 0.48, "ctr": 0.034, "cr": 0.022,
 "ad_creative_style": "minimal_premium",
 "creative_fatigue": 0.12,
 },
 "facebook": {
 "budget_pct": 0.2, "daily_budget": 16,
 "cpc": 0.93, "ctr": 0.025, "cr": 0.031,
 "ad_creative_style": "minimal_premium",
 "creative_fatigue": 0.08,
 },
 },
 "total_daily_budget": 80,
 "ad_paused": False,

 "organic_social": {
 "platforms": ["tiktok", "instagram"],
 "post_frequency": "3_per_week",
 "content_style": "ugc_mix",
 "follower_count": 0,
 "avg_organic_reach": 500,
 },

 "kol_campaigns": [
 {
 "name": "@IceMaster", "platform": "tiktok",
 "followers": 32000, "engagement_rate": 0.082,
 "cost": 150, "type": "paid_review",
 "status": "posted", "post_day": 13,
 "views": 82000, "clicks": 3200, "orders": 15,
 "content_reusable_as_ad": True, # 素材可混剪为广告
 },
 ],

 "ad_creatives": [
 {
 "id": "creative_001", "source": "official",
 "style": "minimal_premium", "ctr": 0.028,
 "days_running": 12, "fatigue_pct": 0.15,
 },
 {
 "id": "creative_002", "source": "kol_remix",
 "original_kol": "@IceMaster",
 "style": "ugc_testimonial", "ctr": 0.041,
 "days_running": 5, "fatigue_pct": 0.03,
 },
 ],

 "active_promotions": [],
 },

 # ===== 品牌PR =====
 "brand": {
 "brand_style": "minimal_premium",
 "brand_story": "",
 "pr_campaigns": [],
 "brand_collabs": [],
 "brand_awareness_score": 0.1, # 0-1, 影响自然搜索
 },

 # ===== 财务 =====
 "finance": {
 "initial_budget": 5000,
 "balance": 3450,
 "reserved": 0, # 用户锁定的储备金
 "total_revenue": 4760,
 "total_cost": 3310,
 "daily_log": [], # 每天一条记录
 },

 # ===== Google Trends 真实数据 =====
 "market_data": {
 "trends_score": 85,
 "trends_direction": "up",
 "trends_change_pct": 15,
 "seasonal_factor": 1.1,
 "last_refresh_day": 10,
 "related_rising_queries": ["cold plunge", "ice bath benefits"],
 "top_regions": ["California", "Texas", "Florida"],
 "competitor_count": 47,
 "avg_competitor_price": 124,
 },

 # ===== 决策日志（用于复盘）=====
 "decision_log": [
 {"day": 6, "agent": "marketing", "action": "switch_tiktok",
 "detail": "50/50 FB/TikTok split", "impact_summary": "CPC -42%"},
 ],

 # ===== 事件日志 =====
 "events": [
 {"day": 13, "type": "kol_viral", "desc": "KOL视频8.2万播放"},
 ],
}
```

---

## 五、Google Trends 驱动预测

### 数据获取与刷新

```
模拟启动时：
 pytrends API → 获取产品关键词的90天历史+实时热度

模拟中每"5模拟天"：
 重新查询 → 如果真实热度变化 ≥ ±15% → 注入为突发事件
```

### Trends → 模拟参数 映射

```
热度(0-100) → 日均曝光基数
 0-20 → 200/天（极冷门）
 20-40 → 800/天
 40-60 → 2,000/天
 60-80 → 5,000/天（热门）
 80-100 → 12,000/天（爆品）

趋势方向 → 周环比增长
 上升 ↗ → 每周 +3-8%
 平稳 → → ±1%
 下降 ↘ → 每周 -3-8%

季节性 → 月度系数
 高峰月 → ×1.3-1.8
 低谷月 → ×0.5-0.7
 中间月 → ×1.0
```

### 用户决策对参数的影响

```
决策类型 影响的参数 幅度
─────────────────────────────────────────────────
换TikTok投放 cpc × 0.6, ctr × 1.3 渠道差异
 conversion × 0.8
加预算翻倍 日曝光 × 1.8 非线性（竞价）
找小KOL(1-5万粉) +3000-5000曝光/3天 一次性脉冲
找大KOL(10-50万粉) +10000-50000曝光/5天 一次性脉冲
达人素材混剪做广告 ctr × 1.3-1.6 素材质量提升
涨价10% conversion × 0.85 价格弹性
降价10% conversion × 1.20 价格弹性
优化详情页 conversion × 1.08 一次性
加FAQ页面 退货率 × 0.85 一次性
搞限时促销 conversion × 1.6 (3天) 短期爆发
做邮件营销 复购率 +3-5% Day 15后生效
换简装包装 unit_cost × 0.9 持续
加大采购量(2x) unit_cost × 0.91 批量折扣
暂停广告 日曝光 → 仅自然流量 立即生效
```

---

## 六、交互流程

### Phase 0：首次对话

```
🧠 Kos：
 👋 我是 Kosbling，你的AI电商工作室。

 告诉我你想卖什么，我的团队会帮你：
 📊 分析市场（基于真实Google Trends数据）
 🏪 模拟30天经营（你随时可以调整策略）
 🚀 跑通后一键部署到真实Shopify

 先说说，你想卖什么？
```

### Phase 1：Idea收敛（3条消息内完成）

```
👤 "户外冰浴桶"

🧠 Kos：
 🎯 收到。快速两个问题：
 1️⃣ 预算？ [$1K] [$3K] [$5K] [$10K]
 2️⃣ 市场？ [🇺🇸北美] [🇪🇺欧洲] [🌏全球]

👤 "$5K 北美"

🧠 Kos：
 ✅ 团队启动中...
 📊 市场分析师查Google Trends...
 📦 供应链查供应商报价...
 📢 营销增长分析竞品...
```

### Phase 2：市场初始化报告

```
🧠 Kos（30秒后）：

 📊 市场快照 | 户外冰浴桶 | 北美
 ───────────────────────────
 📈 Google Trends热度: 78/100 ↗上升
 📦 拿货价: $34 | 海运: $12/件(18天)
 📢 竞品47个 | 价格区间$79-$169
 📢 预估CPC: TikTok $0.55 / FB $0.95
 💰 建议售价$119 | 毛利~55%

 🧠 团队建议：
 "品有机会。TikTok热度在涨，走独立站路线。
 风险：海运周期长，需注意库存周转。"

 🅰️ 开始30天模拟
 🅱️ 调整参数
 🅲️ 换一个产品
```

### Phase 3：模拟推演（每5天一阶段，用户随时插手）

```
👤 "A"

🧠 Kos：⏳ 30天推演启动...

 📅 Day 1-5
 ─────────
 🏪 店铺上线 | 📢 FB+TikTok各50%启动
 📢 数据: CPC $0.75 | CTR 2.8% | 3单 | $357
 💰 余额: $4,502

 💬 调整策略？或"继续"

👤 "TikTok效果好，80%预算给TikTok。另外找几个达人"

📢 社交媒体营销增长：
 ✅ 预算调整 TikTok 80% / FB 20%
 🤝 找到3个匹配达人：
 │ @IceMaster │ 3.2万粉 │ $150 │
 │ @ColdTherapy│ 1.8万粉 │ $80 │
 │ @FitRecovery│ 7.5万粉 │ $300 │
 选哪些？

👤 "前两个。另外达人视频出来后剪一版做广告素材"

📢 社交媒体营销增长：
 ✅ 联系@IceMaster+@ColdTherapy ($230)
 ✅ 内容上线后自动混剪为广告素材投放
 📊 达人素材混剪做广告通常CTR比官方素材高30-60%

🧠 Kos：
 📅 Day 6-10
 ─────────
 📢 TikTok CPC降到$0.48！双渠道对比：
 │ 渠道 │ CPC │ CTR │ 转化率 │ 单数│ ROI │
 │ TikTok │ $0.48 │ 3.4% │ 2.2% │ 6 │2.4x│
 │ Facebook │ $0.93 │ 2.5% │ 3.1% │ 3 │1.7x│

 ⚠️ 📦 供应链预警：
 "按出单速度，Day 18库存耗尽。海运补货来不及。"
 🅰️ 空运50件 ($1,900)
 🅱️ 切预售模式
 🅲️ 降投放减速
 🅳️ 其他（你说）

👤 "B预售，同时海运补100件"

📦 供应链：✅ 海运100件已下单(Day 28到)
🏪 产品页切预售模式
📢 社交媒体营销增长：⚠️ 预售转化率通常降30-40%

🧠 Kos：
 📅 Day 11-15
 ─────────
 🤝 Day 13：达人内容上线！
 • @IceMaster: 8.2万播放！→ 2天内+23单
 • 📢 达人视频已混剪为广告素材投放中
 • 混剪素材CTR 4.1%（比官方素材高46%！）

 ⚠️ 但预售转化率果然跌了（1.8% vs正常3.1%）
 💰 余额: $2,890

👤 "涨价到$129，趋势在涨应该撑得住"

💰 财务：
 ✅ $119→$129。预估：转化-8%，单均利润+$8。
 净效果：利润率从22%升到28%。

（...Day 16-30 继续推演...）
```

### Phase 4：终局结算

```
🧠 Kos：
 🏁 30天推演完成！

 💰 $5,000 → $7,230 (+44.6%)
 📦 87单 | 均价$124
 📢 最佳素材：达人混剪#2 (CTR 4.1%)
 📢 最佳渠道：TikTok (ROAS 2.6x)

 关键决策回顾：
 ✅ Day 6 切TikTok → 省了$830广告费
 ✅ Day 12 找达人 → 带来35单+高CTR素材
 ⚠️ Day 15 预售模式 → 丢了约15单
 ✅ Day 20 涨价$129 → 单均利润+$8

 🔮 如果不同选择：
 • 没找达人 → 利润仅$800
 • Day 15空运而非预售 → 利润$5,900(更多)
 • 没涨价 → 利润$6,950

 下一步：
 🔄 再来一局
 🚀 一键部署到真实环境
 💡 换个新产品
 🆚 同产品不同策略再跑一次
```

---

## 七、技术实现

### 架构图

```
IM客户端(微信/飞书/Slack/TG/WhatsApp/Discord)
 │
 ▼
 OpenClaw Gateway
 (消息路由+会话管理)
 │
 ▼
 🧠 Kos 主控Agent
 (意图解析+状态管理+调度)
 │
 ┌──────┬───┴───┬──────┐
 ▼ ▼ ▼ ▼
 📦 📢 🎨 💰
 供应链 社交媒体 品牌PR 财务
 运营 营销增长
 │ │ │ │
 └──────┴───┬───┴──────┘
 ▼
 OpenBling Runtime
 ┌──────────────────┐
 │ State Manager │ ← SimState JSON持久化
 │ Mode Switch │ ← Shadow/Live切换
 │ Guard (Policy) │ ← 预算上限/操作确认
 │ Google Trends │ ← 真实数据接入
 │ MCP Tool Hub │ ← Shopify/Meta Ads API
 └──────────────────┘
```

### MVP 实现（Layer 0：5天可交付）

```
实际实现：
 1个 OpenClaw Bot（Telegram/Slack优先）
 1个 LLM（Claude/GPT）扮演全部5个Agent
 1个 JSON 文件存 SimState（Redis可选）
 1个 Google Trends API 调用（pytrends，免费）

每轮对话处理流程：
 1. 从文件/Redis读取 SimState JSON
 2. 拼接 System Prompt + SimState + Trends数据 + 用户消息
 3. LLM返回：更新后的SimState + 给用户的回复
 4. 存回 SimState
 5. 发送回复给用户

Prompt核心要求：
 - 按 Agent emoji 前缀标注是谁在说话
 - 用户的每个指令必须量化影响SimState中的数字
 - 所有CPC/CTR/CR必须在合理范围内
 - Agent之间可以有分歧（供应链说备货，财务说没钱）
 - 每次汇报后如有决策点必须给选项
 - 不自动推进——等用户说"继续"
```

### 分层迭代

```
Layer 0（5天）：1个LLM假装5个Agent + Google Trends
 → 验证：用户愿意多轮对话吗？会"再来一局"吗？

Layer 1（+1周）：分段推送节奏感 + 达人素材混剪联动
 → 验证：素材流转逻辑是否让用户觉得真实？

Layer 2（+1周）：真实数据刷新 + 趋势变化注入突发事件
 → 验证：真实数据是否增加信任感？

Layer 3（+2周）：真正的多Agent（OpenClaw multi-agent routing）
 → 验证：Agent争论是否增加参与感？

Layer 4（+2周）：Live Mode + OpenBling Guard
 → 验证：有人敢点"一键部署"吗？
```

---

## 八、传播设计

### IM 截图传播 > 网页链接传播

```
用户收到Agent消息 → 截图发群/朋友圈
"你看，我的AI团队帮我模拟卖冰浴桶，30天赚了$2,230"
→ 别人看到 → 加Bot → 开始对话
转化率：~12.5%（比网页链接0.3%高40倍）
```

### 战报卡片（结算后自动生成）

```
┌─────────────────────────┐
│ 🏪 Kosbling 30天战报 │
│ 📦 户外冰浴桶 │
│ 💰 $5,000 → $7,230 │
│ 📈 +44.6% ROI │
│ 🏆 最佳素材：达人混剪 │
│ "先模拟，跑通再花真钱" │
│ 👉 加 @Kosbling 试试 │
└─────────────────────────┘
```

### 排行榜（龙虾社区/OpenClaw生态）

```
每周全球排行：
 🥇 @张三 - 宠物冷感垫 - $5K→$14.2K (+184%)
 🥈 @JohnD - LED面膜 - $3K→$7.8K (+160%)
 🥉 @Lisa - 露营灯 - $5K→$11.5K (+130%)
```

---

## 九、生态串联

```
用户在IM里说"我想卖冰浴桶"
 │
 ▼
 OpenClaw 接收（证明OpenClaw是最佳Agent网关）
 │
 ▼
 Kosbling 4个Agent模拟30天（证明OpenBling的状态管理+多Agent协调）
 │
 ▼
 用户想部署到真实环境
 │
 ▼
 OpenBling Guard 保护真实操作（证明Guardrails SDK价值）
 │
 ▼
 Agent操作真实Shopify/Meta Ads（证明Sim2Real闭环）
 │
 💰 Kosbling = 获客入口（免费/低价）
 🛡️ OpenBling Guard = 付费层（$99/月）
 ⚙️ OpenBling Runtime = 技术壁垒
```

---

## 十、行动清单

| 优先级 | 任务 | 时间 |
|--------|------|------|
| **P0** | 部署 OpenClaw Bot（Telegram+Slack） | Day 1 |
| **P0** | 写 System Prompt（单LLM扮演5个Agent） | Day 1-2 |
| **P0** | 接入 Google Trends API (pytrends) | Day 2 |
| **P0** | SimState JSON 读写 + 多轮对话逻辑 | Day 3-4 |
| **P0** | 内部测试 + 修bug | Day 5 |
| **P0** | 发布到 r/dropshipping + r/ecommerce | Day 6 |
| **P1** | 达人素材→广告素材联动逻辑 | Week 2 |
| **P1** | Trends数据定时刷新+突发事件注入 | Week 2 |
| **P1** | 战报卡片自动生成 | Week 2 |
| **P2** | 真正的多Agent（OpenClaw routing） | Week 3-4 |
| **P2** | 飞书/微信渠道接入 | Week 3-4 |
| **P3** | Live Mode + OpenBling Guard | Week 5-8 |

**Day 6 发布第一个可用版本。5天，不是5周。**
