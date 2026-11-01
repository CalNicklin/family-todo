import { useMemo, useState } from "react";
import { useBoard } from "../lib/useBoard";
import { supabase } from "../lib/supabase";
import type { List } from "../lib/api";
import { ListCard } from "./ListCard";
import { ConfirmDialog } from "./ConfirmDialog";

export function Board() {
  const board = useBoard();
  const [deleteTarget, setDeleteTarget] = useState<List | null>(null);

  const itemsByList = useMemo(() => {
    const map = new Map<string, typeof board.items>();
    for (const list of board.lists) map.set(list.id, []);
    for (const item of board.items) {
      const arr = map.get(item.listId);
      if (arr) arr.push(item);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) =>
        a.position !== b.position
          ? a.position - b.position
          : String(a.createdAt).localeCompare(String(b.createdAt)),
      );
    }
    return map;
  }, [board.lists, board.items]);

  return (
    <main className="mx-auto max-w-5xl px-3 py-8 sm:px-8 sm:py-14">
      <header className="mb-6 flex items-end justify-between gap-3 sm:mb-9">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-heading sm:gap-3 sm:text-5xl">
          <span aria-hidden="true">🌸</span>
          <span>To Do &amp; To Buy</span>
        </h1>
        <div className="flex shrink-0 items-center gap-3 pb-1">
          <span
            className="flex items-center gap-1.5 text-xs text-muted"
            title={board.online ? "Live — syncing across devices" : "Reconnecting…"}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                board.online ? "bg-emerald-400" : "animate-pulse bg-amber-400"
              }`}
            />
            <span className="hidden sm:inline">
              {board.online ? "Live" : "Reconnecting…"}
            </span>
          </span>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg px-2.5 py-1.5 text-xs text-muted transition hover:bg-white/5 hover:text-item"
          >
            Sign out
          </button>
        </div>
      </header>

      {board.loading ? (
        <p className="text-muted">Loading your lists…</p>
      ) : (
        <div className="grid grid-cols-2 items-start gap-3 sm:gap-5">
          {board.lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              items={itemsByList.get(list.id) ?? []}
              onAddItem={(t) => board.addItem(list.id, t)}
              onToggleItem={board.toggleItem}
              onEditItem={board.editItem}
              onRemoveItem={board.removeItem}
              onEditList={(patch) => board.editList(list.id, patch)}
              onRequestDelete={() => setDeleteTarget(list)}
            />
          ))}

          <button
            type="button"
            onClick={() => board.addList("New list", "📝")}
            className="flex min-h-[120px] items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-ring/70 text-muted transition hover:border-ring-strong hover:text-title"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            New list
          </button>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete “${deleteTarget.name}”?`}
          body="This removes the list and everything in it for everyone. This can't be undone."
          confirmLabel="Delete list"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            board.removeList(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </main>
  );
}
