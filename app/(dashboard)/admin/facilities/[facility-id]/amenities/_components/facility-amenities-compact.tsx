"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useTransition, useState, useDeferredValue } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { 
  updateFacilityAmenitiesAction,
  deleteGlobalAmenityAction
} from "@/server/actions/amenity-actions"

// 🎨 Icon Resolver for premium, curated visual styling
const AMENITY_MATERIAL_ICON_MAP: Record<string, string> = {
  Waves: "waves",
  Droplets: "water_drop",
  Sun: "wb_sunny",
  Flame: "local_fire_department",
  ShieldAlert: "verified_user",
  Clock: "schedule",
  Utensils: "restaurant",
  Wifi: "wifi",
  Coffee: "local_cafe",
  Wind: "air",
  wind: "air",
  Car: "directions_car",
  car: "directions_car",
}

function AmenityIcon({ iconName, className }: { iconName: string; className?: string }) {
  const symbol = AMENITY_MATERIAL_ICON_MAP[iconName] || "circle"
  return <Icon name={symbol} className={className} />
}

interface AmenityItem {
  id: string
  name: string
  icon: string
  category: string
  type: "BOOLEAN" | "QUANTIFIABLE" | "TEXT"
  checked: boolean
  value: string
  isFeatured: boolean
  isSeeded: boolean
  displayOrder: number
}

interface CompactAmenitiesTableProps {
  facilityId: string
  allAmenities: Array<{
    id: string
    name: string
    icon: string
    category: string | null
    isSeeded: boolean
    type: "BOOLEAN" | "QUANTIFIABLE" | "TEXT"
  }>
  initialFacilityAmenities: Array<{
    facilityId: string
    amenityId: string
    value: string | null
    imageUrl: string | null
    displayOrder: number
    isActive: boolean
    isFeatured: boolean
    scheduledAt: Date | null
  }>
}

export function CompactAmenitiesTable({
  facilityId,
  allAmenities,
  initialFacilityAmenities,
}: CompactAmenitiesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // 🔍 Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("")
  const deferredQuery = useDeferredValue(searchQuery)
  
  // 📋 Core Amenities State mapping
  const [items, setItems] = useState<AmenityItem[]>(() => {
    return allAmenities.map(a => {
      const existing = initialFacilityAmenities.find(fa => fa.amenityId === a.id)
      return {
        id: a.id,
        name: a.name,
        icon: a.icon,
        category: a.category || "General Features",
        type: a.type,
        checked: !!existing && existing.isActive,
        value: existing?.value || "",
        isFeatured: existing?.isFeatured || false,
        isSeeded: a.isSeeded,
        displayOrder: existing?.displayOrder ?? 999,
      }
    }).sort((a, b) => {
      // Show checked first, then alphabetical or display order
      if (a.checked !== b.checked) return a.checked ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  })

  // 📝 New Amenity Row States
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [newRow, setNewRow] = useState({
    name: "",
    type: "BOOLEAN" as "BOOLEAN" | "QUANTIFIABLE" | "TEXT",
    category: "General Features",
    icon: "CircleDot",
  })
  const [isCreating, setIsCreating] = useState(false)

  // 🔄 Save specific amenity helper (Instant background transaction)
  const saveAmenity = async (updatedItem: AmenityItem) => {
    startTransition(async () => {
      try {
        const payload = [{
          amenityId: updatedItem.id,
          checked: updatedItem.checked,
          value: updatedItem.value,
          isFeatured: updatedItem.isFeatured,
          displayOrder: updatedItem.displayOrder,
          name: updatedItem.name,
          icon: updatedItem.icon,
          type: updatedItem.type,
        }]
        
        const result = await updateFacilityAmenitiesAction(facilityId, payload)
        
        if (result && !result.success) {
          throw new Error("Registry reject")
        }
        
        toast.success(`Updated ${updatedItem.name}`, {
          description: updatedItem.checked ? "Amenity is registered live." : "Amenity removed from registry.",
          duration: 1500,
        })
        router.refresh()
      } catch (err) {
        toast.error("Auto-sync Failed", {
          description: "Failed to persist changes to the infrastructure grid.",
        })
        // Rollback local state logic can go here if needed
      }
    })
  }

  // 🖱️ Event Handlers
  const handleToggleActive = (id: string, checked: boolean) => {
    const target = items.find(i => i.id === id)
    if (!target) return
    const updated = { ...target, checked }
    setItems(prev => prev.map(item => (item.id === id ? updated : item)))
    saveAmenity(updated)
  }

  const handleToggleFeatured = (id: string) => {
    const target = items.find(i => i.id === id)
    if (!target) return
    const updated = { ...target, isFeatured: !target.isFeatured }
    setItems(prev => prev.map(item => (item.id === id ? updated : item)))
    saveAmenity(updated)
  }

  const handleValueChange = (id: string, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, value }
      }
      return item
    }))
  }

  const handleValueBlur = (id: string) => {
    const item = items.find(i => i.id === id)
    if (item) {
      saveAmenity(item)
    }
  }

  const handleValueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  // 🗑️ Delete Custom Amenity
  const handleDeleteCustom = async (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDeleteCustom = async () => {
    if (!deleteTarget) return
    const { id, name } = deleteTarget
    setDeleteTarget(null)

    startTransition(async () => {
      try {
        const res = await deleteGlobalAmenityAction(id, facilityId)
        if (res && res.success) {
          setItems(prev => prev.filter(item => item.id !== id))
          toast.success("Amenity Deleted", {
            description: `Permanently removed ${name} from registry.`,
          })
          router.refresh()
        } else {
          throw new Error("Failed to delete custom amenity")
        }
      } catch (err) {
        toast.error("Deletion Rejected", {
          description: "This custom asset is still tied to operational dependencies.",
        })
      }
    })
  }

  // ➕ Inline Ingest / Row Creation
  const handleCreateAmenity = async () => {
    if (!newRow.name.trim()) {
      toast.error("Validation Error", { description: "Name is required to register an asset." })
      return
    }

    setIsCreating(true)
    try {
      const tempId = crypto.randomUUID()
      const payload = [{
        amenityId: tempId,
        checked: true,
        value: "",
        displayOrder: items.length,
        isFeatured: false,
        isNew: true,
        name: newRow.name.trim(),
        category: newRow.category,
        icon: newRow.icon,
        type: newRow.type,
      }]

      const result = await updateFacilityAmenitiesAction(facilityId, payload)
      
      if (result && result.success) {
        toast.success("Asset Created & Registered", {
          description: `Custom infrastructure "${newRow.name}" is now live.`,
        })
        
        // Refresh local state lists gracefully
        const newItem: AmenityItem = {
          id: tempId,
          name: newRow.name.trim(),
          icon: newRow.icon,
          category: newRow.category,
          type: newRow.type,
          checked: true,
          value: "",
          isFeatured: false,
          isSeeded: false,
          displayOrder: items.length,
        }

        setItems(prev => [newItem, ...prev])
        setNewRow({
          name: "",
          type: "BOOLEAN",
          category: "General Features",
          icon: "CircleDot",
        })
        router.refresh()
      } else {
        throw new Error("API rejection")
      }
    } catch (err) {
      toast.error("Registration Failed", {
        description: "Verify name uniqueness and schema limits.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Filter items matching search
  const filteredItems = items.filter(item => {
    const term = deferredQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term)
    )
  })

  return (
    <TooltipProvider>
      <div className="rounded-2xl border border-border/50 bg-muted/40 backdrop-blur-xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Table Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility infrastructure, slides, features..."
            className="pl-10 h-10 bg-background/40 border-border/50 text-foreground/80 focus-visible:ring-primary rounded-xl"
          />
        </div>
        
        {isPending && (
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <Icon name="progress_activity" className="text-[14px] animate-spin" />
            Synchronizing...
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/20 max-h-[500px] overflow-y-auto no-scrollbar">
        <Table>
          <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/50">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Infrastructure Asset</TableHead>
              <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</TableHead>
              <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operational Value</TableHead>
              <TableHead className="w-[80px] text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Featured</TableHead>
              <TableHead className="w-[80px] text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow 
                  key={item.id} 
                  className="hover:bg-muted/10 border-border/50 transition-colors group"
                >
                  {/* Toggle Switch */}
                  <TableCell>
                    <Switch
                      checked={item.checked}
                      onCheckedChange={(val) => handleToggleActive(item.id, val)}
                      className="data-[state=checked]:bg-primary cursor-pointer"
                      aria-label="Toggle amenity active"
                    />
                  </TableCell>
                  
                  {/* Amenity Name with Icon Dynamic Resolver */}
                  <TableCell className="font-medium text-foreground/90">
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-muted/30 border border-border text-primary shrink-0">
                        <AmenityIcon iconName={item.icon} className="text-[14px]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate">{item.name}</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest truncate">{item.category}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Value Type Badge */}
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className="text-[9px] font-black uppercase tracking-widest py-0.5 border-border text-muted-foreground"
                    >
                      {item.type}
                    </Badge>
                  </TableCell>

                  {/* Inline Value Form Editing */}
                  <TableCell>
                    {item.checked && (item.type === "QUANTIFIABLE" || item.type === "TEXT") ? (
                      <Input
                        value={item.value}
                        onChange={(e) => handleValueChange(item.id, e.target.value)}
                        onBlur={() => handleValueBlur(item.id)}
                        onKeyDown={(e) => handleValueKeyDown(e, item.id)}
                        placeholder={item.type === "QUANTIFIABLE" ? "e.g. 5 slides" : "e.g. Wi-Fi speed, extra details"}
                        className="h-8 bg-background/40 border-border/50 text-xs text-foreground/90 focus-visible:ring-primary rounded-lg max-w-[180px]"
                        aria-label={`${item.name} value`}
                      />
                    ) : item.checked ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <Icon name="check" className="text-[14px]" />
                        <span>Enabled</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/80 font-medium">Inactive</span>
                    )}
                  </TableCell>

                  {/* Toggle Featured Star */}
                  <TableCell className="text-center">
                    {item.checked ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleToggleFeatured(item.id)}
                            className="outline-none focus:ring-1 focus:ring-primary rounded p-1 group cursor-pointer"
                            aria-label={item.isFeatured ? "Unfeature amenity" : "Feature amenity"}
                          >
                            <Icon name="star" className={`text-[16px] transition-all duration-200 ${
                                item.isFeatured 
                                  ? "text-primary fill-primary drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-110" 
                                  : "text-muted-foreground/60 hover:text-muted-foreground"
                              }`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background border border-border text-foreground/90 text-[10px] font-medium tracking-wide">
                          {item.isFeatured ? "Unfeature amenity on landing" : "Feature amenity on landing"}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">-</span>
                    )}
                  </TableCell>

                  {/* Delete Button (Only Custom Core Amenities) */}
                  <TableCell className="text-right">
                    {!item.isSeeded ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleDeleteCustom(item.id, item.name)}
                            className="text-muted-foreground/80 hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10 cursor-pointer animate-in fade-in zoom-in-95 duration-100"
                            aria-label="Delete custom amenity permanently"
                          >
                            <Icon name="delete" className="text-[14px]" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background border border-border text-foreground/90 text-[10px] font-medium tracking-wide">
                          Delete custom amenity permanently
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            tabIndex={-1}
                            variant="ghost"
                            size="icon"
                            className="cursor-help"
                            aria-label="Core infrastructure, cannot delete"
                          >
                            <Icon name="help" className="text-[14px] text-muted-foreground/40 ml-auto mr-2" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background border border-border text-foreground/90 text-[10px] font-medium tracking-wide">
                          Core Infrastructure (Cannot Delete)
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs font-medium uppercase tracking-widest">
                  No matching assets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ➕ Space-Efficient Table Footer Add Row */}
      <div className="pt-4 border-t border-border/50">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Add Custom Facility Infrastructure</h3>
        <div className="flex flex-col md:flex-row items-center gap-3 bg-background/40 p-4 border border-border/50 rounded-xl">
          <Input
            value={newRow.name}
            onChange={(e) => setNewRow(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Infrastructure Asset Name (e.g. Wave Generator)"
            className="flex-1 h-9 bg-muted border-border/50 text-xs text-foreground/80 focus-visible:ring-primary rounded-lg"
          />

          <Select
            value={newRow.type}
            onValueChange={(val: string) => setNewRow(prev => ({ ...prev, type: val as "BOOLEAN" | "QUANTIFIABLE" | "TEXT" }))}
          >
            <SelectTrigger className="w-[140px] h-9 bg-muted border-border/50 text-xs text-foreground/80 rounded-lg">
              <SelectValue placeholder="Value Type" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border text-foreground/80">
              <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
              <SelectItem value="QUANTIFIABLE">QUANTIFIABLE</SelectItem>
              <SelectItem value="TEXT">TEXT</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={newRow.category}
            onChange={(e) => setNewRow(prev => ({ ...prev, category: e.target.value }))}
            placeholder="Category (e.g. Attractions)"
            className="w-[160px] h-9 bg-muted border-border/50 text-xs text-foreground/80 focus-visible:ring-primary rounded-lg"
          />

          <Button
            type="button"
            onClick={handleCreateAmenity}
            disabled={isCreating || !newRow.name.trim()}
            className="h-9 px-4 bg-primary hover:bg-primary/90 disabled:bg-muted/30 disabled:text-muted-foreground/80 text-primary-foreground text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shrink-0"
          >
            {isCreating ? (
              <Icon name="progress_activity" className="text-[14px] animate-spin" />
            ) : (
              <Icon name="add" className="text-[14px]" />
            )}
            <span>Register Asset</span>
          </Button>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Amenity</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete custom amenity &quot;{deleteTarget?.name}&quot; from the global registry?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteCustom}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
