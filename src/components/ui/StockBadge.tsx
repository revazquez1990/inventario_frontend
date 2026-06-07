interface StockBadgeProps {
  stock: number
  min?: number
}

export function StockBadge({ stock, min = 0 }: StockBadgeProps) {
  const danger = min > 0 && stock < min
  const low = min > 0 && stock <= min
  const classes = danger
    ? 'border-[#d69a8a] bg-[#fff1ea] text-[#8a2d1b]'
    : low
      ? 'border-[#dfc36a] bg-[#fff7d7] text-[#6d5312]'
      : 'border-[#bad6c7] bg-[#edf4ef] text-[#1d4ed8]'

  return <span className={`inline-flex min-h-8 items-center rounded-md border px-3 text-sm font-semibold ${classes}`}>Stock {stock}</span>
}
