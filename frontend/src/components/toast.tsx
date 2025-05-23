import * as React from "react"

const TOAST_TIMEOUT = 5000

type ToastType = {
  id: string
  title?: string
  description: string
  variant?: "default" | "destructive"
}

type ToastContextType = {
  toasts: ToastType[]
  addToast: (toast: Omit<ToastType, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = React.useState<ToastType[]>([])

  const addToast = React.useCallback(
    ({ title, description, variant = "default" }: Omit<ToastType, "id">) => {
      const id = Math.random().toString(36).substr(2, 9)
      setToasts((currentToasts) => [...currentToasts, { id, title, description, variant }])

      setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toast) => toast.id !== id)
        )
      }, TOAST_TIMEOUT)
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    )
  }, [])

  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast]
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
} 