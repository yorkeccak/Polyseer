"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { researchEfforts, type ResearchEffort } from "@/lib/research/effort";
import { cn } from "@/lib/utils";

interface EffortSelectorProps {
  value: ResearchEffort;
  onChange: (value: ResearchEffort) => void;
  disabled?: boolean;
  /** Small note shown under the options, for example who gets emailed. */
  note?: React.ReactNode;
}

/**
 * Compact research-effort control: a pill that opens a small panel with four
 * levels. Lives next to the other pills under the search box.
 */
export function EffortSelector({ value, onChange, disabled = false, note }: EffortSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = researchEfforts.find((effort) => effort.value === value) ?? researchEfforts[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", open && "z-30")}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-black/40 hover:text-white disabled:opacity-60"
      >
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
        <span>
          {selected.label} <span className="text-white/55">· {selected.estimate.replace("About ", "~")}</span>
        </span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Research effort"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/15 bg-neutral-950/90 p-3 text-left text-white shadow-2xl backdrop-blur-xl"
          >
            <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-white/50">Research effort</p>
            <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-white/5 p-1" role="radiogroup" aria-label="Research effort">
              {researchEfforts.map((effort) => {
                const active = effort.value === value;
                return (
                  <button
                    key={effort.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange(effort.value)}
                    className={cn(
                      "rounded-lg px-1 py-2 text-center text-sm font-medium transition-colors",
                      active ? "bg-white text-neutral-900 shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {effort.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3 px-1">
              <p className="text-xs leading-relaxed text-white/70">{selected.description}</p>
              <p className="shrink-0 text-xs text-white/50 tabular-nums">
                {selected.estimate} · {selected.credits}
              </p>
            </div>
            {note && <div className="mt-2 border-t border-white/10 px-1 pt-2 text-[11px] text-white/50">{note}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
