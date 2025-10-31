"use client";

import React, { useEffect, useRef, useState } from "react";

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
  const filtered = options.filter(
    (o) => !value.includes(o.id) && o.label.toLowerCase().includes(input.toLowerCase())
  );

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

  const add = (id: string) => {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setInput("");
    setOpen(false);
    // focus input after select
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const remove = (id: string) => {
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
        if (opt) add(opt.id);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={`min-h-[44px] w-full rounded-md border bg-background px-2 py-1 flex items-center gap-2 flex-wrap ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {selectedOptions.map((opt) => (
          <span
            key={opt.id}
            className='inline-flex items-center gap-2 bg-muted/30 text-sm px-2 py-1 rounded-full'
            onClick={(e) => e.stopPropagation()}
          >
            <span className='max-w-[10rem] truncate'>{opt.label}</span>
            <button
              type='button'
              onClick={() => remove(opt.id)}
              className='inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted/60 text-xs'
              aria-label={`Remove ${opt.label}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={selectedOptions.length === 0 ? placeholder : ""}
          className='min-w-[120px] flex-1 border-0 outline-none bg-transparent text-sm py-1'
          disabled={disabled}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className='absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-48 overflow-auto'>
          <ul>
            {filtered.map((opt, idx) => (
              <li
                key={opt.id}
                className={`px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground flex justify-between items-center ${
                  idx === highlight ? "bg-accent/30" : ""
                }`}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(opt.id)}
                role='option'
                aria-selected={idx === highlight}
              >
                <span className='truncate'>{opt.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
