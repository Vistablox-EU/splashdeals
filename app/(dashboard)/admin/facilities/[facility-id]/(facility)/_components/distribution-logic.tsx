"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { Icon } from "@/components/ui/Icon"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  FormDescription,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/GlassCard"
import { Badge } from "@/components/ui/badge"
import { manageCitiesAction } from "@/server/actions/cities"
import type { UpdateFacilityGovernanceValues } from "@/server/lib/validations/facility"

interface City {
  id: string
  name: string
  slug: string
}

interface DistributionLogicProps {
  availableCities: City[]
}

/**
 * 🗺️ Distribution Logic Component
 * Refactored into a high-density, tag-based Interactive Autocomplete & Reach Manager.
 * Features layout transitions, on-the-fly provisioning, and a collapsible registry editor.
 */
export function DistributionLogic({ availableCities }: DistributionLogicProps) {
  const router = useRouter()
  const { watch, setValue, getValues, formState: { dirtyFields } } = useFormContext<UpdateFacilityGovernanceValues>()
  
  const [isPending, startTransition] = React.useTransition()
  const [isRegistryPending, setIsRegistryPending] = React.useState(false)
  
  const [prevAvailableCities, setPrevAvailableCities] = React.useState(availableCities)
  const [localCities, setLocalCities] = React.useState(availableCities)
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [pendingSlugToSelect, setPendingSlugToSelect] = React.useState<string | null>(null)
  
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Adjust state directly during rendering when prop changes
  if (availableCities !== prevAvailableCities) {
    setPrevAvailableCities(availableCities)
    setLocalCities(availableCities)
  }

  // Sync handle auto-selection of newly created regions
  React.useEffect(() => {
    if (pendingSlugToSelect) {
      const match = availableCities.find(c => c.slug === pendingSlugToSelect)
      if (match) {
        const current = getValues("targetCityIds") || []
        if (!current.includes(match.id)) {
          setValue("targetCityIds", [...current, match.id], { shouldDirty: true })
        }
        // Asynchronously clear state to satisfy react-hooks/set-state-in-effect rule
        setTimeout(() => {
          setPendingSlugToSelect(null)
        }, 0)
      }
    }
  }, [availableCities, pendingSlugToSelect, setValue, getValues])

  // Handle clicking outside autocomplete dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const watchedCityIds = watch("targetCityIds")
  const selectedCityIds = React.useMemo(() => watchedCityIds || [], [watchedCityIds])

  // Derived datasets
  const selectedCities = React.useMemo(() => {
    return localCities.filter(c => selectedCityIds.includes(c.id))
  }, [localCities, selectedCityIds])

  const unselectedCities = React.useMemo(() => {
    return localCities.filter(c => !selectedCityIds.includes(c.id))
  }, [localCities, selectedCityIds])

  const filteredSuggestions = React.useMemo(() => {
    if (!search) return unselectedCities
    const lower = search.toLowerCase()
    return unselectedCities.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.slug.toLowerCase().includes(lower)
    )
  }, [unselectedCities, search])

  const exactMatchExists = React.useMemo(() => {
    if (!search) return true
    const lower = search.toLowerCase().trim()
    return localCities.some(c => c.name.toLowerCase().trim() === lower)
  }, [localCities, search])

  // Action: Add an existing city
  const selectCity = React.useCallback((cityId: string) => {
    const current = getValues("targetCityIds") || []
    if (!current.includes(cityId)) {
      setValue("targetCityIds", [...current, cityId], { shouldDirty: true })
    }
    setSearch("")
    setIsOpen(false)
  }, [getValues, setValue])

  // Action: Remove a selected city
  const removeCity = React.useCallback((cityId: string) => {
    const current = getValues("targetCityIds") || []
    setValue("targetCityIds", current.filter((id: string) => id !== cityId), { shouldDirty: true })
  }, [setValue, getValues])

  // Action: Create new city globally and select it instantly
  const createAndAddCity = React.useCallback(() => {
    const name = search.trim()
    if (name.length < 2) {
      toast.error("Region name must be at least 2 characters")
      return
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-')
    setPendingSlugToSelect(slug)

    startTransition(async () => {
      try {
        const response = await manageCitiesAction([{ name, slug }])
        if (response.success) {
          toast.success(`Region "${name}" added to global registry`)
          setSearch("")
          setIsOpen(false)
          router.refresh()
        } else {
          toast.error(response.error || "Failed to create region")
          setPendingSlugToSelect(null)
        }
      } catch {
        toast.error("Failed to communicate with registry")
        setPendingSlugToSelect(null)
      }
    })
  }, [search, router])

  // Advanced Action: Edit city inline in global registry
  const updateCityRegistry = React.useCallback((id: string, updates: Partial<City>) => {
    setLocalCities(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  // Advanced Action: Save modified registry changes
  const saveRegistryEdit = React.useCallback(async (city: City) => {
    setIsRegistryPending(true)
    try {
      const response = await manageCitiesAction([city])
      if (response.success) {
        toast.success("Global registry updated")
        router.refresh()
      } else {
        toast.error(response.error || "Registry update failed")
      }
    } finally {
      setIsRegistryPending(false)
    }
  }, [router])

  // Advanced Action: Delete city globally from registry
  const purgeCityFromRegistry = React.useCallback(async (city: City) => {
    if (confirm(`Are you sure? This will delete "${city.name}" globally and remove it from all facilities.`)) {
      setIsRegistryPending(true)
      try {
        const deleteRes = await manageCitiesAction([{ ...city, isDeleted: true }])
        if (deleteRes.success) {
          setValue("targetCityIds", selectedCityIds.filter(id => id !== city.id), { shouldDirty: true })
          setLocalCities(prev => prev.filter(c => c.id !== city.id))
          toast.success("Region purged from registry")
          router.refresh()
        } else {
          toast.error(deleteRes.error || "Purge failed")
        }
      } finally {
        setIsRegistryPending(false)
      }
    }
  }, [setValue, selectedCityIds, router])

  return (
    <GlassCard className="p-4 sm:p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 size-32 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16 animate-pulse" />
      
      <header className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <Icon name="tag" className="text-[16px] text-cyan-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-md font-black tracking-tight uppercase text-white">Marketplace Reach</h3>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Configure regional tagging and distribution.</p>
        </div>
      </header>

      <div className="space-y-5 relative z-10">
        
        {/* Component Sub-Header controls */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <FormLabel className="text-[10px] uppercase tracking-widest font-black opacity-70 flex items-center gap-2">
              Target Marketplace Nodes
              {dirtyFields.targetCityIds && (
                <div className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
              )}
            </FormLabel>
            <FormDescription className="text-[9px] mt-0.5">
              Select cities where deals are visible.
            </FormDescription>
          </div>
          
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
            <button 
              type="button" 
              onClick={() => setValue("targetCityIds", localCities.map(c => c.id), { shouldDirty: true })}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-800">|</span>
            <button 
              type="button" 
              onClick={() => setValue("targetCityIds", [], { shouldDirty: true })}
              className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* 🏷️ Interactive Active Region Tag Cloud */}
        <div className="flex flex-wrap gap-1.5 p-3 min-h-[60px] border border-white/5 rounded-xl bg-slate-950/40 backdrop-blur-md">
          {selectedCities.map((city) => (
            <div
              key={city.id}
              className="animate-in fade-in zoom-in-75 duration-150"
            >
                <Badge 
                  variant="outline" 
                  className="h-6 gap-1 bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:text-cyan-300 pr-1 pl-2.5 rounded-lg select-none transition-colors"
                >
                  <span className="text-[10px] font-bold tracking-tight">{city.name}</span>
                  <button
                    type="button"
                    onClick={() => removeCity(city.id)}
                    aria-label={`Remove ${city.name}`}
                    className="size-4 rounded-md inline-flex items-center justify-center hover:bg-red-500/10 text-cyan-500/60 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Icon name="close" className="text-[10px]" />
                  </button>
                </Badge>
            </div>
            ))}
          {selectedCities.length === 0 && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 m-auto select-none">
              <span>No marketplace regions selected</span>
            </div>
          )}
        </div>

        {/* 🔍 Search & Autocomplete Command Center */}
        <div ref={dropdownRef} className="relative">
          <div className="relative">
            <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground" />
            <Input 
              placeholder="Search or add marketplace regions..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              className="h-9 pl-9 bg-slate-950/40 border-white/5 text-[11px] font-bold focus-visible:ring-1 focus-visible:ring-cyan-500/20 placeholder:text-slate-600 rounded-xl"
            />
            {isPending && (
              <Icon name="progress_activity" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] animate-spin text-cyan-400" />
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpen && (search.length > 0 || filteredSuggestions.length > 0) && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 max-h-[180px] overflow-y-auto border border-white/10 rounded-xl bg-slate-950/95 backdrop-blur-xl shadow-2xl z-[70] divide-y divide-white/5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent animate-in fade-in slide-in-from-top-1 duration-150"
            >
                {/* Available Matches */}
                {filteredSuggestions.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => selectCity(city.id)}
                    className="flex items-center justify-between w-full px-3 py-2 text-left text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <span>{city.name}</span>
                    <span className="text-[9px] font-mono text-cyan-500/40">/{city.slug}</span>
                  </button>
                ))}

                {/* Create & Add on the Fly Option */}
                {!exactMatchExists && search.trim().length >= 2 && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={createAndAddCity}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 transition-all cursor-pointer border-t border-emerald-500/10"
                  >
                    {isPending ? (
                      <Icon name="progress_activity" className="text-[12px] animate-spin text-emerald-400" />
                    ) : (
                      <Icon name="add" className="text-[12px] text-emerald-400" />
                    )}
                    <span>Create & select: &quot;{search.trim()}&quot;</span>
                  </button>
                )}

                {filteredSuggestions.length === 0 && exactMatchExists && (
                  <div className="px-3 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
                    No remaining matching regions
                  </div>
                )}
            </div>
          )}
        </div>

        {/* ⚙️ Collapsible Advanced Global Registry Editor */}
        <details className="mt-8 border-t border-white/5 pt-4 group">
          <summary className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white cursor-pointer select-none transition-colors">
            <span className="flex items-center gap-1.5">
              Advanced: Global Registry Editor
            </span>
            <Icon name="keyboard_arrow_down" className="text-[12px] transition-transform duration-300 group-open:rotate-180 text-slate-500" />
          </summary>
          
          <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {localCities.map((city) => (
              <div 
                key={city.id} 
                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/30 border border-white/5"
              >
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                  <Input 
                    value={city.name}
                    disabled={isRegistryPending}
                    onChange={(e) => updateCityRegistry(city.id, { name: e.target.value })}
                    className="h-7 px-2 bg-slate-950/50 border-white/5 text-[10px] font-bold focus-visible:ring-cyan-500/20"
                    placeholder="Region Name"
                  />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] font-mono text-slate-600">/</span>
                    <Input 
                      value={city.slug}
                      disabled={isRegistryPending}
                      onChange={(e) => updateCityRegistry(city.id, { slug: e.target.value })}
                      className="h-7 px-2 bg-slate-950/50 border-white/5 text-[10px] font-mono text-cyan-400/90 focus-visible:ring-cyan-500/20"
                      placeholder="url-slug"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isRegistryPending}
                    onClick={() => saveRegistryEdit(city)}
                    className="size-7 rounded-md text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Save globally"
                  >
                    <Icon name="check" className="text-[14px]" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isRegistryPending}
                    onClick={() => purgeCityFromRegistry(city)}
                    className="size-7 rounded-md text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete globally"
                  >
                    <Icon name="delete" className="text-[14px]" />
                  </Button>
                </div>
              </div>
            ))}
            
            {localCities.length === 0 && (
              <div className="text-center py-4 text-[9px] font-black uppercase tracking-widest text-slate-600">
                No regions in registry
              </div>
            )}
          </div>
        </details>

      </div>
    </GlassCard>
  )
}
