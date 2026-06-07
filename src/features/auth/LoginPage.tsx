import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight, Boxes, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { extractApiError } from '@/api/client'
import { env } from '@/lib/env'
import { authStorage } from '@/lib/auth-storage'
import { useLoginMutation } from '@/features/auth/auth.api'

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio.').email('Escribe un correo válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (authStorage.hasSession()) {
    return <Navigate to="/" replace />
  }

  const serverError = loginMutation.error ? extractApiError(loginMutation.error).message : null

  async function onSubmit(values: LoginFormValues) {
    await loginMutation.mutateAsync(values)
    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-full bg-[#f4f2ea] text-[#20231f]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(380px,0.9fr)_1.1fr]">
        <section className="flex min-h-[42vh] flex-col justify-between bg-[#1d4ed8] p-6 text-white sm:p-10 lg:min-h-screen">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-lg bg-[#f2c94c] text-[#1d4ed8] shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
              <Boxes className="size-7" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#b9d8cf]">Motor 11</p>
              <h1 className="text-2xl font-semibold">{env.appName}</h1>
            </div>
          </div>

          <div className="max-w-xl pb-3 pt-16 lg:pb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f2c94c]">
              Control de inventario
            </p>
            <h2 className="mt-4 max-w-[10ch] text-5xl font-semibold leading-none text-white sm:text-6xl">
              USD y CUP en cada movimiento.
            </h2>
            <div className="mt-8 grid max-w-md grid-cols-3 border-y border-white/18 py-5 text-sm text-[#dfeee9]">
              <span>Productos</span>
              <span>Stock</span>
              <span>Ventas</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[430px]">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#6f766b]">
                Acceso privado
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#20231f]">
                Iniciar sesión
              </h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d443b]">Correo</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6e776e]" />
                  <input
                    className="h-14 w-full rounded-md border border-[#c9c5b8] bg-white pl-12 pr-4 text-base outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/12"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    {...register('email')}
                  />
                </span>
                {errors.email ? (
                  <span className="mt-2 block text-sm text-[#a33b27]">{errors.email.message}</span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d443b]">Contraseña</span>
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6e776e]" />
                  <input
                    className="h-14 w-full rounded-md border border-[#c9c5b8] bg-white pl-12 pr-14 text-base outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/12"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    {...register('password')}
                  />
                  <button
                    className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-[#3d443b] transition hover:bg-[#eee9dc] focus:outline-none focus:ring-3 focus:ring-[#1d4ed8]/15"
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </span>
                {errors.password ? (
                  <span className="mt-2 block text-sm text-[#a33b27]">{errors.password.message}</span>
                ) : null}
              </label>

              {serverError ? (
                <div className="flex gap-3 rounded-md border border-[#d9a99d] bg-[#fff7f3] p-4 text-sm text-[#7d2f1f]">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" />
                  <span>{serverError}</span>
                </div>
              ) : null}

              <button
                className="flex h-14 w-full items-center justify-center gap-3 rounded-md bg-[#1d4ed8] px-5 text-base font-semibold text-white shadow-[0_10px_28px_rgba(22,55,47,0.22)] transition hover:bg-[#0f2b25] focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/20 disabled:cursor-not-allowed disabled:bg-[#7b8883]"
                type="submit"
                disabled={isSubmitting || loginMutation.isPending}
              >
                Entrar
                <ArrowRight className="size-5" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
