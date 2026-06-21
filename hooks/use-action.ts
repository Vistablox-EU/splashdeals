"use client"

import { useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type ActionResult = Record<string, unknown> & {
  success: boolean
  error?: string
  data?: unknown
}

type ActionFn<TArgs extends unknown[]> = (...args: TArgs) => Promise<
  | ({ success: boolean; error?: string; data?: unknown } & Record<string, unknown>)
  | { success: boolean; error?: string; data?: unknown }
>

type UseActionOptions = {
  onSuccess?: (result: ActionResult) => void
  onError?: (error: string) => void
  successMessage?: string
  errorMessage?: string
  refresh?: boolean
}

export function useAction<TArgs extends unknown[]>(
  action: ActionFn<TArgs>,
  options: UseActionOptions = {}
) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { onSuccess, onError, successMessage, errorMessage, refresh = true } = options

    const execute = useCallback(
    (...args: TArgs) => {
      startTransition(async () => {
        try {
          const result = await action(...args)
          if (result.success) {
            if (successMessage) toast.success(successMessage)
            onSuccess?.(result)
            if (refresh) router.refresh()
          } else {
            const msg = result.error || errorMessage || "Something went wrong"
            toast.error(msg)
            onError?.(msg)
          }
        } catch {
          const msg = errorMessage || "Something went wrong"
          toast.error(msg)
          onError?.(msg)
        }
      })
    },
    [action, onSuccess, onError, successMessage, errorMessage, refresh, router]
  )

  return { execute, isPending }
}
