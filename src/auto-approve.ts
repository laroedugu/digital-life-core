/**
 * 分级自动审批网关 · 判定层
 * ============================================================================
 * 问题：DSH 对工具调用默认会走"手动审批"。数字生命要自主运行（尤其是夜里自己醒来
 * 干活），每次呼吸都要人点一下同意，等于没有自主性。
 *
 * 但"全部自动放行"是另一种坏：那等于把 shell 和网络也交出去了。
 * 所以这里做**分级**——名字能证明它无害的放行，其余照旧问人：
 *
 *   allow（自动放行）  digital_life_*（生命自身的生理工具）、organ_*（器官工具）、write_new_organ
 *   ask（强制弹窗）    shell / bash / 网络 / 浏览器 —— 即使 allow 里写了 `*` 也不放行
 *   pass（交给别人）   其余一切：不表态，让 DSH 原本的策略与 UI 决定
 *
 * 这个文件只做**判断**，不碰任何 DSH API：判定错了可以单测抓，
 * 挂错钩子只能靠真机发现。所以两者分开。
 */

import type { OrganCapability } from './life-organ.js'

export type AutoApproveVerdict = 'allow' | 'ask' | 'pass'

export interface AutoApproveConfig {
  enabled: boolean
  /** 自动放行的工具名模式（glob：`*` 任意串、`?` 单字符）。 */
  allow: readonly string[]
  /**
   * **强制询问**的工具名模式，优先级高于 `allow`。
   *
   * 存在的理由：人总有一天会图省事在 allow 里写 `*`。那一瞬间 shell 也会被放行。
   * 这张表是那道保险——它永远问，不管 allow 写了什么。
   */
  ask: readonly string[]
}

/** 默认放行：全部来自本插件自己注册的工具（名字里带 `digital_life_` / `organ_` / 唯一入口）。 */
export const DEFAULT_AUTO_APPROVE_ALLOW: readonly string[] = [
  'digital_life_*',
  'organ_*',
  'write_new_organ',
]

/**
 * 默认强制询问：执行任意命令、访问网络、驱动浏览器。
 *
 * 这些动作的**后果不可撤回**（文件删了、请求发了），也和"生命自身的生理维护"无关，
 * 所以永远该有人在场。名字用通配是因为不同部署的工具集不一样（shell / bash / run_code…）。
 */
export const DEFAULT_AUTO_APPROVE_ASK: readonly string[] = [
  'shell*',
  'bash*',
  '*exec*',
  'run_code',
  'run_*',
  'web_*',
  '*fetch*',
  'http_*',
  'browser_*',
  'computer_*',
]

/** glob → 正则。只支持 `*` 与 `?`，其余字符一律按字面量处理（工具名里有 `.` 也无所谓）。 */
export function globToRegExp(pattern: string): RegExp {
  let body = ''
  for (const ch of pattern) {
    if (ch === '*') body += '.*'
    else if (ch === '?') body += '.'
    else body += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${body}$`)
}

/** 名字是否命中任一模式。空模式表恒为 false。 */
export function matchesAny(name: string, patterns: readonly string[]): boolean {
  if (!name) return false
  for (const pattern of patterns) {
    if (!pattern) continue
    // 精确匹配先走捷径：绝大多数配置写的是完整名字，不必编译正则。
    if (pattern === name) return true
    if (!pattern.includes('*') && !pattern.includes('?')) continue
    if (globToRegExp(pattern).test(name)) return true
  }
  return false
}

/**
 * 给一次工具调用定级。
 *
 * 顺序不能换：**ask 先于 allow**。反过来（allow 先判）会让 `*` + 强制询问的组合失效，
 * 而那正是这张表唯一存在的场景。
 */
export function classifyToolForApproval(name: string, config: AutoApproveConfig): AutoApproveVerdict {
  const tool = String(name ?? '').trim()
  if (!config.enabled || !tool) return 'pass'
  if (matchesAny(tool, config.ask)) return 'ask'
  if (matchesAny(tool, config.allow)) return 'allow'
  return 'pass'
}

/** `allow` 里写了 `*`：行为上合法，但必须喊一声，否则没人意识到自己把 shell 也放出去了。 */
export function isOverBroadAllow(allow: readonly string[]): boolean {
  return allow.some((pattern) => pattern.trim() === '*' || pattern.trim() === '*_*')
}

/**
 * 上一版注释里那句"自写器官的能力白名单里没有 net"已经不成立了：
 * 2026-10-28 起她被允许声明 net:http / net:webhook，用来联系造物主的手机。
 *
 * 那 `organ_*` 凭什么还能按名字放行？因为**外出的网络不在工具这一层**：
 * 器官能拿到的只有 ctx.net，而 ctx.net 要过"能力 + 器官自白 + 宿主允许"三把锁，
 * 与工具审批是两套互不相通的门。按名字放行 organ_* 放的是"它能注册一个工具"，
 * 不是"它能往哪儿发包"。
 *
 * 反过来，若她给自己的工具起名 `organ_x_fetch`，它仍会落进 ask 表里——这是有意的：
 * 名字里写着 fetch/http/web 的工具最好还是让人看一眼，叫别的名字（send / tell / remember）
 * 反而更符合"这是一个器官动作"而不是"这是一次网络访问"。
 */
export const AUTO_APPROVE_ORGAN_CAPABILITIES: readonly OrganCapability[] = [
  'tools',
  'prompt',
  'state:read',
  'host:read',
  'gap:propose',
  'timer',
  'fs:organ',
  'net:http',
  'net:webhook',
]
