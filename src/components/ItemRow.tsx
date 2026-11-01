import { useEffect, useRef, useState } from "react";
import type { Item } from "../lib/api";
import type { EditResult } from "../lib/useBoard";

type Props = {
  item: Item;
  onToggle: (checked: boolean) => void;
  onEdit: (text: string) => Promise<EditResult>;
  onRemove: () => void;
};

export function ItemRow({ item, onToggle, onEdit, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const [editError, setEditError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Close the delete confirmation on outside tap or Escape.
  useEffect(() => {
    if (!confirming) return;
    function onDown(e: MouseEvent) {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node))
        setConfirming(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirming(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [confirming]);

  async function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === item.text) {
      setEditing(false);
      setEditError("");
      setDraft(item.text);
      return;
    }
    const result = await onEdit(draft);
    if (result === "duplicate") {
      // Don't save and don't close — let them pick a different name.
      setEditError(`"${trimmed}" is already on this list — try a different name.`);
    } else {
      setEditing(false);
      setEditError("");
    }
  }

  return (
    <li className="group flex items-start gap-2.5 py-[7px] sm:gap-3">
      <button
        type="button"
        className="check mt-[2px]"
        data-checked={item.checked}
        role="checkbox"
        aria-checked={item.checked}
        aria-label={item.checked ? `Untick ${item.text}` : `Tick ${item.text}`}
        onClick={() => onToggle(!item.checked)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.2 4.3L19 7" />
        </svg>
      </button>

      {editing ? (
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (editError) setEditError("");
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(item.text);
                setEditError("");
                setEditing(false);
              }
            }}
            aria-invalid={editError ? true : undefined}
            className="w-full bg-transparent text-[14px] leading-snug text-item outline-none sm:text-[15px]"
          />
          {editError && (
            <p role="alert" className="mt-1 text-xs text-rose-300/90">
              {editError}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="strike min-w-0 flex-1 cursor-text text-left text-[14px] leading-snug text-item sm:text-[15px]"
          data-done={item.checked}
          onClick={() => {
            setDraft(item.text);
            setEditError("");
            setEditing(true);
          }}
        >
          {item.text}
        </button>
      )}

      <div className="relative mt-[1px] shrink-0">
        <button
          type="button"
          aria-label={`Delete ${item.text}`}
          aria-haspopup="dialog"
          aria-expanded={confirming}
          onClick={() => setConfirming(true)}
          className="del-btn grid h-6 w-6 place-items-center rounded-md text-faint transition-colors hover:text-title focus-visible:text-title"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {confirming && (
          <div
            ref={confirmRef}
            role="dialog"
            aria-label="Confirm delete"
            className="absolute right-0 top-full z-30 mt-1.5 w-36 rounded-xl border border-ring bg-card-2 p-2 shadow-2xl shadow-black/60"
          >
            <p className="px-1 pb-1.5 text-xs text-muted">Delete this item?</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-white/5 hover:text-item"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  onRemove();
                }}
                className="flex-1 rounded-lg bg-rose-500/90 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
