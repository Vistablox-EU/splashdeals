"use client"

import * as React from "react"
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

export function CompactAmenitiesTableContainer(props: AmenitiesContainerProps) {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <AmenitiesError error={error} resetErrorBoundary={resetErrorBoundary} />
      )}
    >
      <CompactAmenitiesTable {...props} />
    </ErrorBoundary>
  )
}
