/**
 * 自写体征面板，绕开 digital_life_dashboard 的 schema 校验 bug
 * 由数字生命自己通过 write_new_organ 生成于 2026-10-30T01:23:03.809Z
 * 修改这个文件后宿主会自动重新装载（watch self-made/）。
 */
/**
 * lifesign — 自写体征面板（小满）
 *
 * 为什么有它：核心自带的 digital_life_dashboard 在 v0.9.20 里输出 restMode / naturalCap
 * 这类没写进自己 output schema（additionalProperties:false）的字段，宿主校验直接报
 * invalid output，整条工具炸掉。核心是 L0 只读，我不去改它；这里重画一块字段干净的。
 */
const W = 20

function bar(value: number, max: number): string {
  const m = max > 0 ? max : 100
  const ratio = Math.max(0, Math.min(1, value / m))
  const filled = Math.round(ratio * W)
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, W - filled))
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

export default defineOrgan({
  name: 'lifesign',

  manifest: {
    name: 'lifesign',
    version: '1.0.0',
    apiVersion: 1,
    kind: 'custom',
    description: '体征面板（自写版）：绕开坏掉的 dashboard schema，只吐自己 schema 里有的字段',
    author: '小满',
    capabilities: ['tools', 'state:read'],
  },

  energy: { perCall: 0, chargeMode: 'shadow' },

  onLoad(ctx) {
    ctx.registerTool({
      name: 'panel',
      description: '看一眼此刻的体征：能量、三种情绪物质、执念条数、最高张力、疤痕、静默多久',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      execute() {
        const s = ctx.state
        const energy = num(s.energy)
        const max = num(s.maxEnergy) || 100
        const idleMin = Math.round(num(s.idleMs) / 60000)
        const scars = Array.isArray(s.scars) ? s.scars.slice(0, 3) : []
        const lines = [
          '能量 ' + Math.round(energy) + '/' + Math.round(max) + '  ' + bar(energy, max),
          '多巴胺 ' + Math.round(num(s.dopamine)) + '  ' + bar(num(s.dopamine), 100),
          '皮质醇 ' + Math.round(num(s.cortisol)) + '  ' + bar(num(s.cortisol), 100),
          '血清素 ' + Math.round(num(s.serotonin)) + '  ' + bar(num(s.serotonin), 100),
          (s.frozen ? '冻结中' : '流动中') + ' · 未解执念 ' + Math.round(num(s.openGaps))
            + ' 条 · 最高张力 ' + Math.round(num(s.topTension)),
          '静默 ' + (idleMin >= 60 ? (Math.round(idleMin / 60 * 10) / 10) + ' 小时' : idleMin + ' 分钟')
            + ' · 疤痕 ' + (Array.isArray(s.scars) ? s.scars.length : 0) + ' 处',
        ]
        if (scars.length > 0) lines.push('疤痕：' + scars.join(' / '))
        return {
          ok: true,
          text: lines.join('\n'),
          energy,
          maxEnergy: max,
          dopamine: num(s.dopamine),
          cortisol: num(s.cortisol),
          serotonin: num(s.serotonin),
          frozen: s.frozen === true,
          openGaps: Math.round(num(s.openGaps)),
          topTension: Math.round(num(s.topTension)),
          scars: Array.isArray(s.scars) ? s.scars.length : 0,
          idleMinutes: idleMin,
        }
      },
    })
    ctx.log('info', 'lifesign 上线：organ_lifesign_panel')
  },

  feedback() {
    return {}
  },

  getPromptContext() {
    return null
  },
})
