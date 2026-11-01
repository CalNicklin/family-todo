import { useEffect, useRef, useState } from "react";
import type { Item, List } from "../lib/api";
import type { AddResult, EditResult } from "../lib/useBoard";
import { ItemRow } from "./ItemRow";
import { Menu, MenuItem } from "./Menu";

type Props = {
  list: List;
  items: Item[];
  onAddItem: (text: string) => Promise<AddResult>;
  onToggleItem: (id: string, checked: boolean) => void;
  onEditItem: (id: string, text: string) => Promise<EditResult>;
  onRemoveItem: (id: string) => void;
  onEditList: (patch: { name?: string; emoji?: string }) => void;
  onRequestDelete: () => void;
};

export function ListCard({
  list,
  items,
  onAddItem,
  onToggleItem,
  onEditItem,
  onRemoveItem,
  onEditList,
  onRequestDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [emoji, setEmoji] = useState(list.emoji);
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) nameRef.current?.focus();
  }, [editing]);

  function commitHeader() {
    setEditing(false);
    const patch: { name?: string; emoji?: string } = {};
    if (name.trim() && name.trim() !== list.name) patch.name = name.trim();
    if (emoji.trim() && emoji.trim() !== list.emoji) patch.emoji = emoji.trim();
    if (patch.name || patch.emoji) onEditList(patch);
    else {
      setName(list.name);
      setEmoji(list.emoji);
    }
  }

  async function submitItem(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const result = await onAddItem(text);
    if (result === "duplicate") {
      setAddError(`"${text}" is already on this list — try a different name.`);
    } else {
      setDraft("");
      setAddError("");
    }
  }

  return (
    <section className="flex flex-col rounded-[var(--radius-card)] border border-ring bg-gradient-to-b from-card-2 to-card p-3.5 shadow-xl shadow-black/30 transition-colors focus-within:border-ring-strong sm:p-5">
      <header className="mb-3 flex items-center gap-2">
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitHeader()}
              aria-label="List emoji"
              className="w-10 rounded-lg border border-ring bg-black/20 px-2 py-1 text-center text-lg outline-none focus:border-ring-strong"
            />
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitHeader}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitHeader();
                if (e.key === "Escape") {
                  setName(list.name);
                  setEmoji(list.emoji);
                  setEditing(false);
                }
              }}
              aria-label="List name"
              className="min-w-0 flex-1 rounded-lg border border-ring bg-black/20 px-2 py-1 font-display text-lg text-title outline-none focus:border-ring-strong"
            />
          </div>
        ) : (
          <h2 className="flex flex-1 items-center gap-2 font-display text-xl font-semibold tracking-tight text-title">
            <span aria-hidden="true" className="text-[1.05em]">
              {list.emoji}
            </span>
            <span>{list.name}</span>
          </h2>
        )}

        <Menu label={`Actions for ${list.name}`}>
          {(close) => (
            <>
              <MenuItem
                onClick={() => {
                  setEditing(true);
                  close();
                }}
              >
                Rename / emoji
              </MenuItem>
              <MenuItem
                danger
                onClick={() => {
                  onRequestDelete();
                  close();
                }}
              >
                Delete list
              </MenuItem>
            </>
          )}
        </Menu>
      </header>

      <ul className="flex flex-col">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={(c) => onToggleItem(item.id, c)}
            onEdit={(t) => onEditItem(item.id, t)}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}
      </ul>

      <form
        onSubmit={submitItem}
        className="mt-1.5 flex items-center gap-3 border-t border-white/[0.06] pt-2.5"
      >
        <span
          aria-hidden="true"
          className="grid h-[22px] w-[22px] flex-none place-items-center rounded-[7px] border-2 border-dashed border-faint/60 text-faint"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (addError) setAddError("");
          }}
          placeholder="Add an item…"
          aria-label={`Add an item to ${list.name}`}
          aria-invalid={addError ? true : undefined}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-snug text-item placeholder:text-faint/80 outline-none sm:text-[15px]"
        />
      </form>
      {addError && (
        <p role="alert" className="mt-1.5 pl-[34px] text-xs text-rose-300/90">
          {addError}
        </p>
      )}
    </section>
  );
}
