import { BadgeDollarSign } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export function RateBadge() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const rate = useQuery({
    queryKey: ['rate-today'],
    queryFn: async () => (await apiClient.get('/exchange-rate/today')).data as { exists: boolean; rate?: { usd_to_cup: string } },
  })
  const save = useMutation({
    mutationFn: async (usd_to_cup: number) => (await apiClient.post('/exchange-rate', { usd_to_cup })).data,
    onSuccess: async () => {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['rate-today'] })
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(new FormData(event.currentTarget).get('usd_to_cup'))
    if (Number.isFinite(value) && value > 0) save.mutate(value)
  }

  const currentValue = rate.data?.rate?.usd_to_cup
  const isToday = rate.data?.exists

  return (
    <div className="relative">
      <button
        className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isToday ? 'border-[#bad6c7] bg-[#edf4ef] text-[#16372f]' : 'border-[#dfb84b] bg-[#fff7d7] text-[#6d5312]'}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <BadgeDollarSign className="size-4" />
        {currentValue ? `Ratio ${Number(currentValue).toFixed(2)}${!isToday ? ' *' : ''}` : 'Sin ratio'}
      </button>
      {open ? (
        <form
          key={currentValue ?? 'empty'}
          className="absolute right-0 top-12 z-30 w-64 rounded-md border border-[#d8d2c2] bg-[#fbfaf5] p-3 shadow-xl"
          onSubmit={submit}
        >
          <label className="block text-sm font-medium">Ratio USD/CUP</label>
          {!isToday && currentValue && (
            <p className="mt-1 text-xs text-[#6d5312]">* Usando último ratio guardado</p>
          )}
          <input
            className="mt-2 h-11 w-full rounded-md border border-[#c9c5b8] px-3"
            name="usd_to_cup"
            type="number"
            step="0.0001"
            min="0.0001"
            required
            defaultValue={currentValue ?? ''}
          />
          <button className="mt-3 h-10 w-full cursor-pointer rounded-md bg-[#16372f] font-semibold text-white" type="submit">Guardar</button>
        </form>
      ) : null}
    </div>
  )
}
