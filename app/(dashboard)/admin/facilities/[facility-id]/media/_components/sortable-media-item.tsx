"use client";

import { FacilityMedia } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MediaItemCard } from "./media-item-card";

interface SortableMediaItemProps {
  item: FacilityMedia;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleHero: () => void;
  onToggleCardBG: () => void;
  onToggleVisibility: () => void;
  focalPointMediaId?: string | null;
  onToggleFocalPoint?: () => void;
  onCrop?: () => void;
  onFocalPointSaved?: (id: string, coords: string) => void;
  onUnsavedEdit?: (value: boolean) => void;
  onRename?: () => void;
}

export function SortableMediaItem(props: SortableMediaItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.id,
    disabled: props.isSelectionMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="listitem"
      aria-roledescription="sortable"
      aria-label={`Media item ${props.item.order + 1}. Pritisnite razmak za premestanje, strelice za redosled.`}
    >
      <MediaItemCard
        item={props.item}
        isSelected={props.isSelected}
        isSelectionMode={props.isSelectionMode}
        onSelect={props.onSelect}
        onDelete={props.onDelete}
        listeners={listeners}
        attributes={attributes}
        onToggleHero={props.onToggleHero}
        onToggleCardBG={props.onToggleCardBG}
        onToggleVisibility={props.onToggleVisibility}
        focalPointMediaId={props.focalPointMediaId}
        onToggleFocalPoint={props.onToggleFocalPoint}
        onCrop={props.onCrop}
        onFocalPointSaved={props.onFocalPointSaved}
        onUnsavedEdit={props.onUnsavedEdit}
        onRename={props.onRename}
      />
    </div>
  );
}
