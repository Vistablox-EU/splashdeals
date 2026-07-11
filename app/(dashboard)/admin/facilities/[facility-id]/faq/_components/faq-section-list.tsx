"use client";

import { useState, useCallback } from "react";
import { createFaq, updateFaq, deleteFaq, reorderFaqs } from "../actions";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SerializedFAQ {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
}

interface Props {
  facilityId: string;
  initialFaqs: SerializedFAQ[];
}

export function FAQSectionList({ facilityId, initialFaqs }: Props) {
  const [faqs, setFaqs] = useState<SerializedFAQ[]>(initialFaqs);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{
    id: string;
    field: "question" | "answer";
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; question: string } | null>(null);

  // ─── Toggle collapse ────────────────────────────
  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ─── Add new ─────────────────────────────────────
  const handleAdd = useCallback(async () => {
    const faq = await createFaq(facilityId, "", "");
    setFaqs((prev) => [...prev, faq]);
    setExpanded((prev) => new Set(prev).add(faq.id));
    // Start editing question immediately
    setEditingField({ id: faq.id, field: "question" });
    setEditValue("");
    toast.success("Pitanje dodato", {
      description: "Novo FAQ pitanje je kreirano.",
      duration: 2000,
    });
  }, [facilityId]);

  // ─── Start inline edit ───────────────────────────
  const startEdit = useCallback(
    (id: string, field: "question" | "answer", currentValue: string) => {
      setEditingField({ id, field });
      setEditValue(currentValue);
    },
    [],
  );

  // ─── Save inline edit ────────────────────────────
  const saveEdit = useCallback(async () => {
    if (!editingField) return;
    const { id, field } = editingField;
    await updateFaq(id, { [field]: editValue });
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: editValue } : f)));
    setEditingField(null);
    setEditValue("");
  }, [editingField, editValue]);

  // ─── Cancel inline edit ──────────────────────────
  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  // ─── Delete ──────────────────────────────────────
  const handleDelete = useCallback((id: string, question: string) => {
    setDeleteTarget({ id, question: question || "Novo pitanje" });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { id, question } = deleteTarget;
    setDeleteTarget(null);
    await deleteFaq(id);
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    toast.success("Pitanje obrisano", {
      description: `Pitanje "${question.length > 40 ? question.slice(0, 40) + "..." : question}" je obrisano.`,
      duration: 2000,
    });
  }, [deleteTarget]);

  // ─── Drag & Drop ─────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!dragId || dragId === targetId) return;

      setFaqs((prev) => {
        const items = [...prev];
        const fromIdx = items.findIndex((f) => f.id === dragId);
        const toIdx = items.findIndex((f) => f.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        return items;
      });
    },
    [dragId],
  );

  const handleDragEnd = useCallback(async () => {
    setDragId(null);
    // Persist new order
    const reordered = faqs.map((f, i) => ({
      id: f.id,
      displayOrder: i,
    }));
    await reorderFaqs(reordered);
    setFaqs((prev) => prev.map((f, i) => ({ ...f, displayOrder: i })));
  }, [faqs]);

  // ─── Input key handler ───────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        saveEdit();
      }
      if (e.key === "Escape") {
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit],
  );

  return (
    <div className="space-y-2">
      {faqs.map((faq) => {
        const isExpanded = expanded.has(faq.id);
        const isEditingQuestion = editingField?.id === faq.id && editingField.field === "question";
        const isEditingAnswer = editingField?.id === faq.id && editingField.field === "answer";

        return (
          <div
            key={faq.id}
            draggable
            onDragStart={(e) => handleDragStart(e, faq.id)}
            onDragOver={(e) => handleDragOver(e, faq.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "bg-card rounded-xl border transition-all",
              dragId === faq.id && "ring-primary opacity-50 ring-2",
              isExpanded
                ? "border-primary/30 shadow-sm"
                : "border-border hover:border-muted-foreground/30",
            )}
          >
            {/* Header row — question + controls */}
            <div
              className="flex cursor-pointer items-center gap-2 px-4 py-3 select-none"
              onClick={() => !isEditingQuestion && toggleExpand(faq.id)}
            >
              {/* Drag handle */}
              <Icon
                name="drag_indicator"
                className="text-muted-foreground/40 hover:text-muted-foreground size-4 shrink-0 cursor-grab active:cursor-grabbing"
              />

              {/* Question */}
              <div className="min-w-0 flex-1">
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
                    className="text-foreground block truncate text-sm font-medium"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEdit(faq.id, "question", faq.question);
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
                className="text-muted-foreground size-4 shrink-0"
              />

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(faq.id, faq.question);
                }}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7 shrink-0 rounded-lg transition-all"
                aria-label="Obriši"
              >
                <Icon name="delete" className="size-3.5" />
              </Button>
            </div>

            {/* Answer section — shown when expanded */}
            {isExpanded && (
              <div className="border-border border-t px-4 py-3">
                {isEditingAnswer ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    placeholder="Unesite odgovor..."
                    className="min-h-[80px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    className="text-muted-foreground cursor-text text-sm whitespace-pre-wrap"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEdit(faq.id, "answer", faq.answer);
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
        );
      })}

      {/* Add button */}
      <Button variant="outline" size="sm" onClick={handleAdd} className="mt-4 w-full">
        <Icon name="add" className="mr-1 size-4" />
        Dodaj pitanje
      </Button>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši pitanje</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete ovo pitanje? Ova radnja je nepovratna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Otkaži
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
