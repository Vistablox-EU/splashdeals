"use client"

import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: EmptyStateAction
  compact?: boolean
}

/**
 * Shared empty / no-results placeholder used by TicketPanel and GroupPanel.
 */
export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        compact ? "py-12 px-4" : "h-[360px]"
      } text-center animate-in zoom-in-95 duration-500`}
    >
      <div
        className={`${compact ? "p-4" : "p-6"} rounded-2xl bg-primary/5 border border-primary/10 mb-4`}
      >
        <Icon name={icon} className={`${compact ? "text-[32px]" : "text-[48px]"} text-primary/60`} />
      </div>
      <p
        className={`${compact ? "text-xs" : "text-xl"} font-black text-foreground uppercase tracking-tighter italic mb-1`}
      >
        {title}
      </p>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest max-w-sm mx-auto leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          className="h-10 px-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary/90"
        >
          <Icon name="add" className="mr-2 text-[14px]" />
          {action.label}
        </Button>
      )}
    </div>
  )
}
