"use client"

import * as React from "react"

type FacilityData = {
  id: string
  name: string
  status: string
  slug: string
  category: string
}

const FacilityContext = React.createContext<FacilityData | null>(null)

export function useFacility() {
  const ctx = React.useContext(FacilityContext)
  if (!ctx) throw new Error("useFacility must be used within FacilityProvider")
  return ctx
}

export function FacilityProvider({
  facility,
  children,
}: {
  facility: FacilityData
  children: React.ReactNode
}) {
  return (
    <FacilityContext.Provider value={facility}>
      {children}
    </FacilityContext.Provider>
  )
}
