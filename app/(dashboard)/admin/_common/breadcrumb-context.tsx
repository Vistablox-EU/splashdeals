"use client"

import * as React from "react"

interface BreadcrumbContextType {
  overrides: Record<string, string>
  setOverride: (segment: string, label: string) => void
  removeOverride: (segment: string) => void
  hideGlobalHeader: boolean
  setHideGlobalHeader: (hide: boolean) => void
}

const BreadcrumbContext = React.createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = React.useState<Record<string, string>>({})
  const [hideGlobalHeader, setHideGlobalHeader] = React.useState(false)

  const setOverride = React.useCallback((segment: string, label: string) => {
    setOverrides((prev) => ({ ...prev, [segment]: label }))
  }, [])

  const removeOverride = React.useCallback((segment: string) => {
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[segment]
      return next
    })
  }, [])

  return (
    <BreadcrumbContext.Provider 
      value={{ 
        overrides, 
        setOverride, 
        removeOverride, 
        hideGlobalHeader, 
        setHideGlobalHeader 
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbs() {
  const context = React.useContext(BreadcrumbContext)
  if (!context) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider")
  }
  return context
}
