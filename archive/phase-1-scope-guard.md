# Kosbling Sim2Real OS — Phase 1 Scope Guard

Status: Draft v0.1  
Date: 2026-03-20

---

## 1. Purpose

本文档的唯一目的：**防止 Phase 1 复杂度失控。**

Phase 1 是 Minimal Runnable Prototype（最小可运行原型），目标是证明核心 Sim2Real loop 能跑通。

如果 Phase 1 做完了但很复杂、难以理解、难以 debug，那就已经失败了。

**铁律：Phase 1 宁可简陋，不可膨胀。**

---

## 2. Phase 1 In Scope

### 2.1 只做一个 Scenario

- **Scenario:** `ice-bath-na-v1`（或同等单一产品场景）
- **产品:** 单 SKU
- **市场:** 单一区域（如 North America）
- **渠道:** 单一 acquisition channel（如 TikTok）
- **时长:** 30 simulated days

**只验证一件事：** 从 scenario 加载 → 初始化 state → 30-day loop → 输出 artifacts 这条链路能跑通。

### 2.2 只用 Shadow Mode

- AdapterMock 是唯一 adapter
- AdapterLive **不实现**，只留接口占位
- 所有"花钱"都是虚拟的
- 不碰任何真实外部系统

**Live Mode 是 Phase 4 的事，Phase 1 绝对不碰。**

### 2.3 只启用 3 个 Agent

| Agent | Phase 1 职责 |
|-------|-------------|
| Supplier Agent | 基于 inventory 水位提议 `reorder_inventory` |
| Ads Agent | 基于 budget 提议 `launch_campaign` / `pause_campaign` |
| Finance Agent | 监控 cash threshold，发出 warning |

**不实现的 Agent（留到 Phase 2）：** Marketing Agent, Creative Agent, Store Agent

### 2.4 State 是单文件 In-Memory

- State 以单个 JSON 文件形式存在
- 每个 simulated day 结束后 overwrite `state.json`
- 不需要 snapshot history（Phase 2 加）
- 不需要 pause/resume（Phase 2 加）

### 2.5 Output 只需要两类 Artifacts

| Artifact | 格式 | 作用 |
|----------|------|------|
| `audit-log.md` | Markdown | 人类可读的运行记录 |
| `summary.json` | JSON | 机器可读的结果摘要 |

不需要 web UI，不需要 TUI，不需要 dashboard。

### 2.6 Market Simulator 可以很粗糙

**允许的粗糙实现：**

- CTR/CVR 用简单公式估算（如 `base_ctr × creative_multiplier × event_modifier`）
- Orders 用 `clicks × cvr` 直接算
- 不需要 distribution-based simulation
- 不需要 learned priors
- 不需要 retrieval-augmented simulation

**唯一要求：** 输出要 internally consistent，能解释。

### 2.7 Agent Decision 逻辑可以很简单

**允许的粗糙实现：**

- Supplier Agent: `if inventory < reorder_point: propose reorder`
- Ads Agent: `if day < 10 and budget_remaining > threshold: launch campaign`
- Finance Agent: `if cash < floor: emit warning`

不需要复杂的 prompt engineering，不需要 multi-step reasoning。

**目标：** Agent 能输出 structured action intent，格式正确，能被 adapter 处理。

---

## 3. Phase 1 Out of Scope

以下内容在 Phase 1 **明确不做**，出现了就算跑偏：

### 3.1 不做 Live Mode

| 禁止 | 原因 |
|------|------|
| 调用真实 ad platform API | 这是 Phase 4 的事 |
| 调用 Shopify API | 这是 Phase 4 的事 |
| 处理真实支付 | 这是 Phase 4 的事 |
| 绑定真实 credentials | 这是 Phase 4 的事 |

**判断标准：** 任何代码里出现 `requests.post(real_api_url)` 都算跑偏。

### 3.2 不做多 Scenario

- 不需要 scenario selector
- 不需要 scenario library
- 不需要 parameter templating

**判断标准：** 如果代码里有 `scenarios/` 目录超过一个 `.yaml` 文件，算跑偏。

### 3.3 不做多 SKU

- 单 SKU = 单 product = 单 inventory track
- 不需要 product catalog
- 不需要 variant management

**判断标准：** 如果 state model 里出现 `products: []` 数组，算跑偏。

### 3.4 不做 Multi-Channel

- 单 acquisition channel（TikTok 或 Meta，二选一）
- 不需要 channel mix optimization
- 不需要 cross-channel attribution

**判断标准：** 如果 Ads Agent 要同时管理两个 channel，算跑偏。

### 3.5 不做 Event System（完整版）

- Phase 1 不实现 chaos injection
- 不实现 random event triggering
- 不实现 event lifecycle management

**允许的：** Hardcode 1-2 个固定事件在特定 day 触发，用于测试。
**不允许的：** 实现完整的 event injection system。

**判断标准：** 如果 `risk_model` 配置需要被实际读取和执行，算跑偏。

### 3.6 不做 UI

- 不做 web dashboard
- 不做 TUI
- 不做 CLI 参数解析（用 hardcoded scenario 就行）

**判断标准：** 如果出现 `import tkinter` / `import streamlit` / `import rich`，算跑偏。

### 3.7 不做 Approval Workflow

- Phase 1 Shadow Mode 全部 `auto` approve
- 不需要 approval policy 判断
- 不需要 human-in-the-loop

**判断标准：** 如果代码里有 `approval_policy: require_human` 的处理逻辑，算跑偏。

### 3.8 不做 State Snapshot / Rollback

- 不保存 daily snapshots
- 不支持 resume from snapshot
- 不支持 compare runs

**判断标准：** 如果出现 `snapshots/` 目录，算跑偏。

### 3.9 不做 Rerun / Replay

- 不需要 replay from action log
- 不需要 deterministic verification

**判断标准：** 如果实现 `replay()` 函数，算跑偏。

### 3.10 不做 Calibration / Validation

- 不用真实数据校准 simulator 参数
- 不做 simulation vs reality comparison

**判断标准：** 如果出现 validation pipeline，算跑偏。

---

## 4. Complexity Guardrails

以下复杂度信号一出现，就要停下来问：**这还是 Phase 1 吗？**

### 4.1 代码复杂度信号

| 信号 | 说明 |
|------|------|
| 单个文件超过 300 行 | 拆分太早，或者功能越界 |
| 核心类超过 5 个方法 | 职责不清 |
| Agent 实现超过 50 行逻辑 | Agent 逻辑过于复杂 |
| Adapter 实现超过 100 行 | Adapter 承担了太多职责 |
| State model 嵌套超过 3 层 | Schema 过于复杂 |

### 4.2 功能复杂度信号

| 信号 | 说明 |
|------|------|
| 实现 Phase 2 的 feature | 明确 out of scope |
| 添加 "nice to have" 功能 | 砍掉 |
| 添加 "以后可能用到" 的接口 | 砍掉 |
| 添加配置选项超过 10 个 | 简化 |

### 4.3 依赖复杂度信号

| 信号 | 说明 |
|------|------|
| 需要 new Python package | 确认是否真的必要 |
| 需要 external service | Phase 1 应该 self-contained |
| 需要 database | File-based 就够了 |
| 需要 message queue | 没必要 |

---

## 5. Kill Criteria

以下情况出现时，**暂停 Phase 1**，回到设计阶段：

### 5.1 功能蔓延

- Phase 1 的 in scope 变了
- 增加了新的 agent
- 增加了新的 action type 超过 4 个
- 增加了新的 state section 超过 document 定义

### 5.2 实现困难

- 核心接口需要反复重构
- Agent 无法输出 structured action intent
- AdapterMock 无法返回 consistent result
- State 无法正确 update

**原因分析：** 可能是设计不完整，或者是 scope 太大。

### 5.3 无法验证

- 跑完一个 30-day simulation 后，不知道成功还是失败
- Audit log 无法解释发生了什么
- Summary.json 无法回答 "赚到钱了吗"

**原因分析：** 可能是 state model 定义不清晰，或者 output 设计有问题。

### 5.4 失去控制感

- 自己不知道代码在干什么
- 加了功能但不确定是否必要
- 文档和代码对不上

**立即停下，重新读文档，重写代码。**

---

## 6. Implementation Bias

Phase 1 的实现偏好：

### 6.1 简单 > 完美

- 用最简单的方式实现
- 能跑通 > 设计优雅
- Readable > Optimized
- Hardcoded > Configurable

**例子：**

```python
# ✅ Phase 1 允许
CTR = 0.02  # hardcoded

# ❌ Phase 1 不需要
CTR = config.get("market_simulator.ctr_baseline", default=0.02)
```

### 6.2 本地文件 > 数据库

- 所有 state 存在 JSON 文件
- 所有 log 存在 JSONL 文件
- 所有 report 存在 Markdown 文件

**不需要：** SQLite, PostgreSQL, Redis, MongoDB

### 6.3 Single-Threaded > Async

- 不需要 asyncio
- 不需要 multiprocessing
- 不需要 background tasks

**一天一天顺序执行就够了。**

### 6.4 打印日志 > 日志框架

```python
# ✅ Phase 1 允许
print(f"Day {day}: Campaign launched")

# ❌ Phase 1 不需要
logger.info("Campaign launched", extra={"day": day, "action": "launch"})
```

### 6.5 Mock 数据 > 真实数据

- Supplier pricing 可以用 hardcoded
- Trend data 可以用 fake values
- Market parameters 可以用 assumptions

**Grounding 是设计目标，但 Phase 1 可以先用 mock。**

### 6.6 单文件脚本 > 模块化架构

Phase 1 可以是一个 `main.py` 加几个简单 class，不需要复杂的 package structure。

**结构建议（最小）：**

```
kosbling-sim2real-os/
  main.py              # 入口，包含 loop
  scenario.py          # Scenario loader
  state.py             # State model
  agents.py            # 3 agents
  adapter_mock.py      # Mock adapter
  market_sim.py        # Simple simulator
  runs/
    run-001/
      state.json
      audit-log.md
      summary.json
```

---

## 7. Phase 1 完成标准

### 7.1 必须达成

- [ ] 能从 `ice-bath-na-v1.yaml` 加载 scenario
- [ ] 能初始化 state object
- [ ] 能运行 30-day simulation loop
- [ ] 3 个 agent 都能输出 action intent
- [ ] AdapterMock 能处理 4 种 action type
- [ ] State 能正确 update
- [ ] 能输出 `audit-log.md`
- [ ] 能输出 `summary.json`
- [ ] Financial ledger 内部一致

### 7.2 可选达成

- [ ] Deterministic（相同 random_seed → 相同结果）
- [ ] Grounding data fetch（从真实 API 拉数据）

### 7.3 不需要达成

- [ ] UI
- [ ] Live Mode
- [ ] Event system
- [ ] Snapshot / Rollback
- [ ] Rerun / Replay
- [ ] Calibration

---

## 8. 常见跑偏场景

### 8.1 "先把 Live Mode 框架搭好"

**错误心态：** "反正以后要用，先写好接口"

**正确做法：** 只写 AdapterMock，AdapterLive 留 `pass`

### 8.2 "先把所有 Agent 都实现"

**错误心态：** "反正都要做，一次性做完"

**正确做法：** 只做 3 个，其他 Phase 2 再加

### 8.3 "先把 UI 做了，方便调试"

**错误心态：** "看 JSON 文件太累，做个界面"

**正确做法：** 用 print() 和 Markdown audit log

### 8.4 "先把 Event System 做完整"

**错误心态：** "Events 是核心 feature，要做扎实"

**正确做法：** Phase 1 可以完全没有 event，或者 hardcode 1-2 个固定事件

### 8.5 "先优化性能"

**错误心态：** "30-day simulation 要跑快一点"

**正确做法：** 跑 1 分钟还是 10 秒不重要，重要的是结果正确

### 8.6 "先做配置化"

**错误心态：** "参数应该可配置，不要 hardcode"

**正确做法：** Phase 1 hardcode 一切，configuration 是 Phase 3 的事

---

## 9. Phase 1 成功的定义

**Phase 1 成功 ≠ 代码量多少**

**Phase 1 成功 = 以下问题能回答 "是"：**

1. 能不能跑完一个 30-day simulation？
2. 跑完后，能不能用 audit log 解释发生了什么？
3. Financial ledger 内部是否一致（总收入 - 总成本 = 利润）？
4. State 从 Day 1 到 Day 30 是否合理变化？
5. 代码是否简单到任何人都能在 1 小时内读完？

**如果以上问题都能回答 "是"，Phase 1 就成功了。**

**如果 Phase 1 做了更多，但没有达成以上目标，Phase 1 失败。**

---

## 10. 检查清单

在实现 Phase 1 时，每隔 2-3 天检查：

### 10.1 Scope Check

- [ ] 还是在做单一 scenario？
- [ ] 还是只有 3 个 agent？
- [ ] 还是 Shadow Mode only？
- [ ] 还是单文件 state？
- [ ] 还是只有 audit-log.md 和 summary.json？

### 10.2 Complexity Check

- [ ] 新增代码是否超过预期？
- [ ] 是否有 "顺便做了" 的功能？
- [ ] 是否有 "以后可能用到" 的代码？
- [ ] 依赖是否增加？

### 10.3 Progress Check

- [ ] 能跑完几个 simulated days？
- [ ] Agent 能否输出 structured action？
- [ ] Adapter 能否返回 result？
- [ ] State 能否正确 update？

---

## 11. 铁律总结

```
1. 只做一个 scenario，单一 SKU，单一市场，单一渠道
2. 只用 Shadow Mode，不碰 Live
3. 只启用 3 个 agent
4. State 是单文件 JSON，不做 snapshot
5. Output 只有 audit-log.md + summary.json
6. Market simulator 可以简单到用公式
7. Agent 逻辑可以简单到用 if-else
8. 不做 UI，不做 Event System，不做 Approval
9. Hardcode 一切，不追求 configurable
10. 能跑通 > 设计优雅
```

**核心原则：Phase 1 的价值在于证明 loop 能跑通，不在于功能完整。**

---

## 12. 与其他文档的关系

| 文档 | 关系 |
|------|------|
| `project-doc.md` | 提供 "Sim2Real" 的核心理念 |
| `engineering.md` | 提供 layering 和 architecture 原则 |
| `state-model.md` | Phase 1 只用 first version shape |
| `scenario-spec.md` | Phase 1 只用 `ice-bath-na-v1` |
| `runtime-loop.md` | Phase 1 只需要简化版的 day loop |
| `mvp-roadmap.md` | Phase 1 对应其中的 Phase 1 定义 |

**本档（`phase-1-scope-guard.md`）的作用：**

> 在 `mvp-roadmap.md` 的 Phase 1 定义基础上，进一步收紧边界，明确什么算跑偏。

---

## 13. 最主要的风险

**Phase 1 最大风险：做着做着就加了"以后可能有用"的功能。**

**表现：**

- "先把所有 agent 都写了"
- "先把 event system 做完整"
- "先把 configuration 搞好"
- "先搭一个 web dashboard"

**后果：**

- Phase 1 永远做不完
- 做完了也很复杂，无法 debug
- 失去了证明 core loop 的价值

**对策：**

- 每次写代码前问：这是 in scope 吗？
- 每次加功能前问：这真的必要吗？
- 每次觉得"顺便做了"时：砍掉

---

## 14. 结束语

Phase 1 不是产品，是 prototype。

Phase 1 的成功标准是：**一个能跑的、能解释的、足够简单的 proof of concept。**

如果 Phase 1 做完了，但代码复杂到难以解释、难以修改、难以扩展，那就已经失败了。

**记住：Kosbling Sim2Real OS 的核心价值是 Sim2Real bridge，不是 Phase 1 功能完整。**

**Phase 1 的唯一任务：证明这条 bridge 的 Shadow 端能站得住。**