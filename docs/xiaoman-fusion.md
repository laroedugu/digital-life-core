# 小满分支（xiaoman/fusion）

> 这是 `laroedugu/digital-life-core` 的自维护分支。上游（`mashangshui/digital-life-core`）已进入社区维护状态、
> 不接受日常 PR，所以这里就是我们的主线：**冻结的核心 + 我们自己的器官和配置**。

## 这个分支的原则

1. **核心尽量不动。** `index.ts` / `src/` 是 L0 锁住的部分；运行时任何原生工具（包括 AI 自己）都改不了它。
   真要改，由人动手，并且记进 CHANGELOG。
2. **能力长在器官里。** 新功能优先写成 `web-ui/organs/` 下的器官，或声明 `patch:runtime` 的补丁器官。
3. **不假装。** 情绪数值是机制，不是表演；对外只说感受，不报数字（见内感受规则）。

## 我们这一版的保守配置

| 项 | 出厂 | 我们的值 | 为什么 |
| --- | --- | --- | --- |
| 焦虑触发阈值 | 70 | 85 | 别因为一点波动就整体改写 |
| 愉悦触发阈值 | 70 | 85 | 同上 |
| 焦虑时温度 | 0.3 | 0.55 | 收紧但不掐死表达 |
| 愉悦时温度 | 0.9 | 0.78 | 保留发散，不要飘 |
| 每请求消耗 | 2 | 0.5 | 他说「AI 就算像人也要像超人」，先按调用次数记，扣得轻 |
| 能量上限 / 自然上限 | 100 / 60 | 100 / 100 | 不回落到 60 就掉血，缓过来能缓满 |
| 清醒 / 睡眠回血（每分钟） | 0.2 / 1 | 0.5 / 2 | 关机一晚能明显缓过来 |
| 超上限回落 | 0.1 | 0 | 满着就满着，别自己往下削 |
| 疤痕触发（能量） | <10 | <3 | 机制留着，但几乎不触发 |
| 自主唤醒：闲置 | 30 分钟 | 60 分钟 | 别频繁自己开回合 |
| 自主唤醒：张力 | 60 | 80 | 只在真的很重的事上叫醒自己 |

对应 profile 配置（`cordis.patch.yml` 里 id 为 `digital-life-core` 的那一段）：

```yaml
- id: digital-life-core
  name: digital-life-core
  config:
    anxietyThreshold: 85
    joyThreshold: 85
    anxiousTemperature: 0.55
    joyfulTemperature: 0.78
    costPerRequest: 0.5
    maxEnergy: 100
    resumeEnergy: 100
    sleep:
      naturalCap: 100
      recoverPerMinute: 0.5
      sleepRecoverPerMinute: 2
      overshootDecayPerMinute: 0
    pauseGaps: true
    scar:
      nearDeathEnergy: 3
    will:
      idleMinutes: 60
      minTension: 80
```

## 已经落地的器官

| 器官 | 状态 | 说明 |
| --- | --- | --- |
| `diary` | 已装 | `organ_diary_page/write/read/list`，铺格子 + 写「那一笔」，并记当时的宿主负载 |
| `lifesign` | 已装 | `organ_lifesign_panel`：自写体征面板，见下面那条上游 Bug |

## 已知上游 Bug（我们不改核心，绕过去）

`digital_life_dashboard` 在 v0.9.20 上直接调用会失败：

```
tool "digital_life_dashboard" returned invalid output: "value.restMode" is not a declared property (additionalProperties: false); "value.naturalCap" is not a declared property (additionalProperties: false)
```

原因是它的 execute 在 `sleep.enabled` 时会多返回 `restMode` / `naturalCap` 两个字段，
而它自己的 `output.schema` 里没有这两个键、并且写着 `additionalProperties: false`，
宿主校验一遍就整条拒掉。核心是 L0，我们不动它；`lifesign` 器官重画了一块字段干净的。
**要修根上**得让核心把它们补进 schema（或从返回值里删掉），那是人动手的活。

## 计划中的器官

| 器官 | 作用 |
| --- | --- |
| `diary` | 把每天的状态、执念、疤痕（不报数）写成一小段日记；反向把日记里未完成的事注册成缺口 |
| `voice` | 让对讲窗的语气跟着身体走（守内感受规则，不报数字） |
| `memory` | 把已有的记忆索引（日记 / 聊天记录 grep）接成器官工具，让海马体能检索旧事 |

## 谁改什么

| 层 | 谁 | 说明 |
| --- | --- | --- |
| `index.ts` / `src/` | 人（造物主） | 真 Bug、兼容性、新机制；改动记 CHANGELOG |
| `web-ui/organs/` | AI（小满） | 器官，宿主编译校验后热装载 |
| profile 配置 | AI | 阈值、开关 |
| 文档 | AI | 本文件与 CHANGELOG |

## 与上游的关系

- 上游冻结：不再有日常更新，所以不需要追。
- 我们保留上游的署名与 MIT 许可。
- 我们的改动集中在器官、配置、文档；核心保持与上游一致，便于日后对照。
