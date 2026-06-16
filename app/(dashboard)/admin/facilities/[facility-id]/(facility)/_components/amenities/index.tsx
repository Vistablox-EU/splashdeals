"use client"

import * as React from "react"
import { AmenitiesSkeleton } from "./amenities-skeleton"
import { AmenitiesError } from "./amenities-error-boundary"
import { CompactAmenitiesTable } from "./facility-amenities-compact"

interface ErrorBoundaryProps {
  fallback: (props: { error: Error; resetErrorBoundary: () => void }) => React.ReactNode
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * 🛡️ React class-based Error Boundary
 * Zero-dependency error isolation to prevent crashes from cascading.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Amenities Module Boundary Exception caught:", error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback({
        error: this.state.error,
        resetErrorBoundary: this.resetErrorBoundary
      })
    }

    return this.props.children
  }
}

interface AmenitiesContainerProps {
  facilityId: string
  allAmenities: any[]
  initialFacilityAmenities: any[]
}

/**
 * 🧱 CompactAmenitiesTableContainer
 * 
 * Modular entrypoint wrapped with:
 * - ErrorBoundary: catches and recovers from DB or fetch exceptions.
 * - Suspense: enables PPR-compliant skeleton layouts to prevent CLS.
 */
export function CompactAmenitiesTableContainer(props: AmenitiesContainerProps) {
  return (
    <ErrorBoundary 
      fallback={({ error, resetErrorBoundary }) => (
        <AmenitiesError error={error} resetErrorBoundary={resetErrorBoundary} />
      )}
    >
      <React.Suspense fallback={<AmenitiesSkeleton />}>
        <CompactAmenitiesTable {...props} />
      </React.Suspense>
    </ErrorBoundary>
  )
}

// Export main container as default & named for backward compatibility
export { CompactAmenitiesTableContainer as CompactAmenitiesTable }
export default CompactAmenitiesTableContainer
