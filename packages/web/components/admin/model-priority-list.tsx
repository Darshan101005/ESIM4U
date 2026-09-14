"use client";

import { useState } from "react";
import { GripVertical, X, Plus } from "lucide-react";
import { CHAT_MODEL_CATALOG, type ChatModelKey } from "@/lib/site-settings-types";

/**
 * Drag-to-reorder list of chat models. The `value` array is the enabled models
 * in priority order (first = highest). Unselected models appear below as
 * "add" rows. Reordering the enabled rows changes which model is tried first.
 */
export default function ModelPriorityList({
  value,
  onChange,
}: {
  value: ChatModelKey[];
  onChange: (next: ChatModelKey[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const byKey = new Map(CHAT_MODEL_CATALOG.map((m) => [m.key, m]));
  const disabled = CHAT_MODEL_CATALOG.filter((m) => !value.includes(m.key));

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-[12px] text-amber-600 font-medium">Add at least one model below.</p>
      )}

      {value.map((key, i) => {
        const m = byKey.get(key);
        if (!m) return null;
        const isDragging = dragIndex === i;
        const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
        return (
          <div
            key={key}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnter={() => setOverIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white transition-all cursor-grab active:cursor-grabbing ${
              isDragging ? "opacity-50 border-[#FF561E]" : isOver ? "border-[#FF561E] ring-2 ring-[#FF561E]/10" : "border-[#FF561E]/40 bg-[#FFF9F6]"
            }`}
          >
            <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
            <span className="w-5 h-5 rounded-md bg-[#FF561E] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-[13.5px] font-semibold text-[#1A1D20]">{m.label}</span>
              <span className="text-[12px] text-[#6B7280]"> — {m.hint}</span>
            </span>
            <button
              type="button"
              onClick={() => onChange(value.filter((k) => k !== key))}
              title="Remove"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {disabled.length > 0 && (
        <div className="pt-1 space-y-2">
          {disabled.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onChange([...value, m.key])}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 text-left hover:border-[#FF561E]/50 hover:bg-[#FFF9F6] transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="text-[13.5px] font-semibold text-[#6B7280]">{m.label}</span>
                <span className="text-[12px] text-gray-400"> — {m.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
