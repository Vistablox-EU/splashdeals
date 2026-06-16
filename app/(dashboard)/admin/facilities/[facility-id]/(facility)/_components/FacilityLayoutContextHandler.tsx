"use client"

import * as React from "react"
import { useBreadcrumbs } from "@/components/admin/breadcrumb-context"

export function FacilityLayoutContextHandler({ 
  facilityId, 
  facilityName 
}: { 
  facilityId: string, 
  facilityName: string 
}) {
  const { setOverride, removeOverride, setHideGlobalHeader } = useBreadcrumbs()

  React.useEffect(() => {
    // Hide the global header when inside a facility route
    setHideGlobalHeader(true)
    
    // Override the facility ID segment with the facility name
    setOverride(facilityId, facilityName)

    return () => {
      setHideGlobalHeader(false)
      removeOverride(facilityId)
    }
  }, [facilityId, facilityName, setOverride, removeOverride, setHideGlobalHeader])

  return null
}
