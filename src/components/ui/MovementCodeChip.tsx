export function MovementCodeChip({ code, status }: { code: string; status?: string }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#c9c5b8] bg-white px-3 text-sm font-semibold text-[#20231f]">
      {code}
      {status ? <span className="text-xs font-medium text-[#687168]">{status}</span> : null}
    </span>
  )
}
