"use client"

import { useState, useCallback } from "react"
import { createFaq, updateFaq, deleteFaq, reorderFaqs } from "../actions"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SerializedFAQ {
  id: string
  question: string
  answer: string
  displayOrder: number
}

interface Props {
  facilityId: string
  initialFaqs: SerializedFAQ[]
}

export function FAQSectionList({ facilityId, initialFaqs }: Props) {
  const [faqs, setFaqs] = useState<SerializedFAQ[]>(initialFaqs)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingField, setEditingField] = useState<{
    id: string
    field: "question" | "answer"
  } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [dragId, setDragId] = useState<string | null>(null)

  // ─── Toggle collapse ────────────────────────────
  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ─── Add new ─────────────────────────────────────
  const handleAdd = useCallback(async () => {
    const faq = await createFaq(facilityId, "", "")
    setFaqs((prev) => [...prev, faq])
    setExpanded((prev) => new Set(prev).add(faq.id))
    // Start editing question immediately
    setEditingField({ id: faq.id, field: "question" })
    setEditValue("")
  }, [facilityId])

  // ─── Start inline edit ───────────────────────────
  const startEdit = useCallback(
    (id: string, field: "question" | "answer", currentValue: string) => {
      setEditingField({ id, field })
      setEditValue(currentValue)
    },
    []
  )

  // ─── Save inline edit ────────────────────────────
  const saveEdit = useCallback(async () => {
    if (!editingField) return
    const { id, field } = editingField
    await updateFaq(id, { [field]: editValue })
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: editValue } : f))
    )
    setEditingField(null)
    setEditValue("")
  }, [editingField, editValue])

  // ─── Cancel inline edit ──────────────────────────
  const cancelEdit = useCallback(() => {
    setEditingField(null)
    setEditValue("")
  }, [])

  // ─── Delete ──────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    await deleteFaq(id)
    setFaqs((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // ─── Drag & Drop ─────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      setDragId(id)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", id)
    },
    []
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (!dragId || dragId === targetId) return

      setFaqs((prev) => {
        const items = [...prev]
        const fromIdx = items.findIndex((f) => f.id === dragId)
        const toIdx = items.findIndex((f) => f.id === targetId)
        if (fromIdx === -1 || toIdx === -1) return prev
        const [moved] = items.splice(fromIdx, 1)
        items.splice(toIdx, 0, moved)
        return items
      })
    },
    [dragId]
  )

  const handleDragEnd = useCallback(async () => {
    setDragId(null)
    // Persist new order
    const reordered = faqs.map((f, i) => ({
      id: f.id,
      displayOrder: i,
    }))
    await reorderFaqs(reordered)
    setFaqs((prev) =>
      prev.map((f, i) => ({ ...f, displayOrder: i }))
    )
  }, [faqs])

  // ─── Input key handler ───────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        saveEdit()
      }
      if (e.key === "Escape") {
        cancelEdit()
      }
    },
    [saveEdit, cancelEdit]
  )

  return (
    <div className="space-y-2">
      {faqs.map((faq) => {
        const isExpanded = expanded.has(faq.id)
        const isEditingQuestion =
          editingField?.id === faq.id && editingField.field === "question"
        const isEditingAnswer =
          editingField?.id === faq.id && editingField.field === "answer"

        return (
          <div
            key={faq.id}
            draggable
            onDragStart={(e) => handleDragStart(e, faq.id)}
            onDragOver={(e) => handleDragOver(e, faq.id)}
            onDragEnd={handleDragEnd}
            className={`rounded-xl border bg-card transition-all ${
              dragId === faq.id ? "opacity-50 ring-2 ring-primary" : ""
            } ${
              isExpanded
                ? "border-primary/30 shadow-sm"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            {/* Header row — question + controls */}
            <div
              className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
              onClick={() => !isEditingQuestion && toggleExpand(faq.id)}
            >
              {/* Drag handle */}
              <Icon
                name="drag_indicator"
                className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing size-4 shrink-0"
              />

              {/* Question */}
              <div className="flex-1 min-w-0">
                {isEditingQuestion ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    placeholder="Unesite pitanje..."
                    className="h-8 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="text-sm font-medium text-foreground truncate block"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      startEdit(faq.id, "question", faq.question)
                    }}
                  >
                    {faq.question || (
                      <span className="text-muted-foreground/50 italic">
                        Kliknite dvaput da unesete pitanje...
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Expand/collapse icon */}
              <Icon
                name={isExpanded ? "expand_less" : "expand_more"}
                className="size-4 text-muted-foreground shrink-0"
              />

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(faq.id)
                }}
                className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                title="Obriši"
              >
                <Icon name="delete" className="size-3.5" />
              </button>
            </div>

            {/* Answer section — shown when expanded */}
            {isExpanded && (
              <div className="border-t border-border px-4 py-3">
                {isEditingAnswer ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    placeholder="Unesite odgovor..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    className="text-sm text-muted-foreground whitespace-pre-wrap cursor-text"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      startEdit(faq.id, "answer", faq.answer)
                    }}
                  >
                    {faq.answer || (
                      <span className="text-muted-foreground/50 italic">
                        Kliknite dvaput da unesete odgovor...
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full mt-4"
      >
        <Icon name="add" className="size-4 mr-1" />
        Dodaj pitanje
      </Button>
    </div>
  )
}
