"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Option = {
  id: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string[]; // array of ids
  onChange: (vals: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn danh mục...",
  disabled = false,
  className = "",
}: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedOptions = options.filter((o) => value.includes(o.id));
  const filtered = options.filter((o) =>
    o.label?.toLowerCase().includes(input.toLowerCase())
  );

  // Dynamic calculation of visible items based on width
  const [maxVisible, setMaxVisible] = useState(selectedOptions.length);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateVisible = () => {
      if (!containerRef.current) return;

      // Get container usable width (subtract padding and placeholders)
      const containerWidth = containerRef.current.offsetWidth - 60; // ~60px buffer for +N badge, padding, and X icons

      let currentWidth = 0;
      let count = 0;

      // Approximate width calculation (safest without complex DOM measuring loop)
      // Base: 24px (icon+padding) + ~7px per character
      for (const opt of selectedOptions) {
        const labelLength = opt.label?.length || 0;
        const itemEstimatedWidth = 24 + labelLength * 7.5;

        if (currentWidth + itemEstimatedWidth > containerWidth && count > 0) {
          break;
        }

        currentWidth += itemEstimatedWidth;
        count++;
      }

      // If none fit (super long first item), show 1 and let it truncate
      setMaxVisible(Math.max(1, count));
    };

    calculateVisible();

    // Recalculate on resize
    window.addEventListener("resize", calculateVisible);
    return () => window.removeEventListener("resize", calculateVisible);
  }, [selectedOptions, value]); // content changes

  const visibleOptions = selectedOptions.slice(0, maxVisible);
  const remainingCount = selectedOptions.length - maxVisible;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => setHighlight(0), [input, open]);

  const toggle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
    setInput("");
    // Keep open for multi-selection
  };

  const remove = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      // remove last
      remove(value[value.length - 1]);
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (open) {
      if (e.key === "ArrowDown") {
        setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setHighlight((h) => Math.max(h - 1, 0));
        e.preventDefault();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = filtered[highlight];
        if (opt) toggle(opt.id);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={`h-12 w-full rounded-md border-2 bg-background px-3 flex items-center gap-2 transition-all duration-200 ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-text hover:border-primary/50"
        } ${open ? "border-primary ring-2 ring-primary/20" : "border-input"}`}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            inputRef.current?.focus();
          }
        }}
      >
        <div
          ref={containerRef}
          className="flex-1 flex items-center gap-1.5 overflow-hidden"
        >
          {visibleOptions.map((opt) => (
            <Badge
              key={opt.id}
              variant="secondary"
              className="rounded-sm px-1.5 py-0.5 text-xs font-medium flex items-center gap-1 shrink-0 max-w-[150px]"
            >
              <span className="truncate">{opt.label}</span>
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive shrink-0"
                onClick={(e) => remove(opt.id, e)}
              />
            </Badge>
          ))}
          {remainingCount > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm whitespace-nowrap flex-shrink-0">
              +{remainingCount}
            </span>
          )}
          {selectedOptions.length === 0 && !input && (
            <span className="text-sm text-muted-foreground truncate">
              {placeholder}
            </span>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            className="flex-1 border-0 outline-none bg-transparent text-sm py-1 min-w-[50px] shrink-1"
            disabled={disabled}
          />
        </div>
        <div className="flex items-center gap-1 opacity-50 flex-shrink-0">
          {selectedOptions.length > 0 && (
            <X
              className="h-4 w-4 cursor-pointer hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
            />
          )}
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-md border-2 border-primary/30 bg-popover text-popover-foreground shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {filtered.map((opt, idx) => {
              const isSelected = value.includes(opt.id);
              return (
                <li
                  key={opt.id}
                  className={`px-3 py-2 cursor-pointer text-sm font-medium transition-colors flex justify-between items-center ${
                    idx === highlight
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(opt.id)}
                  role="option"
                  aria-selected={idx === highlight}
                >
                  <span className="truncate mr-2">{opt.label}</span>
                  {isSelected && (
                    <Check
                      className={`h-4 w-4 ${
                        idx === highlight
                          ? "text-primary-foreground"
                          : "text-primary"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
