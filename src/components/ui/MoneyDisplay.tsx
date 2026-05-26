interface MoneyDisplayProps {
  usd: number | string
  cup?: number | string
  rate?: number | string
  compact?: boolean
}

const usdFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' })
const cupFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'CUP' })

export function MoneyDisplay({ usd, cup, rate = 1, compact = false }: MoneyDisplayProps) {
  const usdValue = Number(usd ?? 0)
  const rateValue = Number(rate || 1)
  const cupValue = cup === undefined ? usdValue * rateValue : Number(cup)

  return (
    <span className={compact ? 'text-sm font-semibold' : 'font-semibold'} title={`Ratio aplicado: ${rateValue.toFixed(4)}`}>
      {usdFormatter.format(usdValue)} / {cupFormatter.format(cupValue)}
      {!compact ? <span className="ml-1 text-xs font-normal text-[#687168]">ratio {rateValue.toFixed(2)}</span> : null}
    </span>
  )
}
