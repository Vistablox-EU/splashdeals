import { ReactNode } from "react"

export default function FacilitiesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
