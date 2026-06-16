/**
 * 按权重比例分摊金额（整分向下取整 + 最后一笔吃剩余分），保证各分项金额之和等于总金额（元）。
 * 比例数组为任意非负权重，按 sum(权重) 归一；若权重之和对应 100% 语义，则分摊后各项金额占比合计为 100%。
 *
 * @param {number|string} totalYuan 总金额（元），按两位小数换算为「分」后运算
 * @param {number[]} ratioWeights 权重/比例，非负；不全为 0 时按权重分摊；长度与结果一一对应
 * @returns {{ amounts: number[], sharePercent: number[] }} amounts 为每项金额（元）；sharePercent 为该项占合计的百分比（0–100），合计严格为 100（totalFen>0 时）
 */
export function splitAmountByRatios(totalYuan, ratioWeights) {
  if (!Array.isArray(ratioWeights) || ratioWeights.length === 0) {
    return { amounts: [], sharePercent: [] }
  }

  const weights = ratioWeights.map((x) => {
    const n = Number(x)
    return Number.isFinite(n) && n > 0 ? n : 0
  })
  const sumW = weights.reduce((a, b) => a + b, 0)

  const total = Number(totalYuan)
  const totalFen = Math.round((Number.isFinite(total) ? total : 0) * 100)

  if (sumW <= 0) {
    return {
      amounts: weights.map(() => 0),
      sharePercent: weights.map(() => 0),
    }
  }

  if (totalFen <= 0) {
    return {
      amounts: weights.map(() => 0),
      sharePercent: weights.map((w) => (w * 100) / sumW),
    }
  }

  const n = weights.length
  let sumFen = 0
  const rowFens = new Array(n)

  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1
    const rowFen = isLast ? totalFen - sumFen : Math.floor((weights[i] * totalFen) / sumW + 1e-9)
    if (!isLast) sumFen += rowFen
    rowFens[i] = rowFen
  }

  const amounts = rowFens.map((fen) => fen / 100)
  const sharePercent = rowFens.map((fen) => (fen * 100) / totalFen)

  return { amounts, sharePercent }
}
