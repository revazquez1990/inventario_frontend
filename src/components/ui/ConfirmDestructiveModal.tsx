import { AlertTriangle } from 'lucide-react'

interface ConfirmDestructiveModalProps {
  open: boolean
  title: string
  body: string
  reason?: string
  requireReason?: boolean
  onReasonChange?: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDestructiveModal({
  open,
  title,
  body,
  reason = '',
  requireReason = false,
  onReasonChange,
  onCancel,
  onConfirm,
}: ConfirmDestructiveModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-md bg-[#fbfaf5] p-5 shadow-xl">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 size-6 shrink-0 text-[#a33b27]" />
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-[#5e675e]">{body}</p>
          </div>
        </div>
        {requireReason ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium">Motivo</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-[#c9c5b8] bg-white p-3 outline-none focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/12"
              value={reason}
              onChange={(event) => onReasonChange?.(event.target.value)}
            />
          </label>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button className="h-11 rounded-md border border-[#c9c5b8] px-4 font-medium" type="button" onClick={onCancel}>Cancelar</button>
          <button
            className="h-11 rounded-md bg-[#a33b27] px-4 font-semibold text-white disabled:opacity-50"
            type="button"
            disabled={requireReason && reason.trim().length < 5}
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
