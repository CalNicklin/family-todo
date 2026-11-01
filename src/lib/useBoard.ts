import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import * as api from "./api";
import type { List, Item } from "./api";

const uid = () => crypto.randomUUID();

export type AddResult = "added" | "duplicate" | "empty";
export type EditResult = "saved" | "duplicate" | "unchanged" | "empty";

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Owns the whole board: loads lists + items, applies optimistic edits, and
 * keeps in sync with other devices over Supabase realtime. On any failure it
 * refetches so the screen reflects the database, never a wrong guess.
 */
export function useBoard() {
  const [lists, setLists] = useState<List[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const reloadRef = useRef<() => void>(() => {});

  const reload = useCallback(async () => {
    try {
      const board = await api.fetchBoard();
      setLists(board.lists);
      setItems(board.items);
    } catch {
      setOnline(false);
    }
  }, []);
  reloadRef.current = reload;

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();

    // Live sync: merge each change in place so other devices update without a
    // full refetch (and our own echoed changes merge idempotently).
    const channel = supabase
      .channel("board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        (p) => {
          setItems((prev) => mergeChange(prev, p, api.toItem));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lists" },
        (p) => {
          setLists((prev) => mergeChange(prev, p, api.toList));
        },
      )
      .subscribe((status) => {
        setOnline(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") reloadRef.current();
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload]);

  // ── Item actions ─────────────────────────────────────────────────────────
  const addItem = useCallback(
    async (listId: string, text: string): Promise<AddResult> => {
      const trimmed = text.trim();
      if (!trimmed) return "empty";
      // Per-list, case-insensitive duplicate guard.
      const dup = items.some(
        (i) => i.listId === listId && norm(i.text) === norm(trimmed),
      );
      if (dup) return "duplicate";
      const position =
        Math.max(-1, ...items.filter((i) => i.listId === listId).map((i) => i.position)) +
        1;
      const optimistic: Item = {
        id: uid(),
        listId,
        text: trimmed,
        checked: false,
        position,
        createdAt: new Date().toISOString() as unknown as Item["createdAt"],
      };
      setItems((prev) => [...prev, optimistic]);
      try {
        await api.insertItem({
          id: optimistic.id,
          list_id: listId,
          text: trimmed,
          position,
        });
      } catch {
        reload();
      }
      return "added";
    },
    [items, reload],
  );

  const toggleItem = useCallback(
    async (id: string, checked: boolean) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
      try {
        await api.setItemChecked(id, checked);
      } catch {
        reload();
      }
    },
    [reload],
  );

  const editItem = useCallback(
    async (id: string, text: string): Promise<EditResult> => {
      const trimmed = text.trim();
      if (!trimmed) return "empty";
      const current = items.find((i) => i.id === id);
      if (!current) return "empty";
      if (current.text === trimmed) return "unchanged";
      // Block renaming onto another item's name in the same list (case-insensitive,
      // excluding this item so fixing capitalisation still works).
      const dup = items.some(
        (i) =>
          i.id !== id && i.listId === current.listId && norm(i.text) === norm(trimmed),
      );
      if (dup) return "duplicate";
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, text: trimmed } : i)));
      try {
        await api.setItemText(id, trimmed);
      } catch {
        reload();
      }
      return "saved";
    },
    [items, reload],
  );

  const removeItem = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      try {
        await api.deleteItem(id);
      } catch {
        reload();
      }
    },
    [reload],
  );

  // ── List actions ─────────────────────────────────────────────────────────
  const addList = useCallback(
    async (name: string, emoji: string) => {
      const trimmed = name.trim() || "New list";
      const position = Math.max(-1, ...lists.map((l) => l.position)) + 1;
      const optimistic: List = {
        id: uid(),
        name: trimmed,
        emoji: emoji || "📝",
        position,
        createdAt: new Date().toISOString() as unknown as List["createdAt"],
      };
      setLists((prev) => [...prev, optimistic]);
      try {
        await api.insertList({
          id: optimistic.id,
          name: trimmed,
          emoji: optimistic.emoji,
          position,
        });
      } catch {
        reload();
      }
    },
    [lists, reload],
  );

  const editList = useCallback(
    async (id: string, patch: { name?: string; emoji?: string }) => {
      setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      try {
        await api.updateList(id, patch);
      } catch {
        reload();
      }
    },
    [reload],
  );

  const removeList = useCallback(
    async (id: string) => {
      setLists((prev) => prev.filter((l) => l.id !== id));
      setItems((prev) => prev.filter((i) => i.listId !== id));
      try {
        await api.deleteList(id);
      } catch {
        reload();
      }
    },
    [reload],
  );

  return {
    lists: [...lists].sort(byPosition),
    items,
    loading,
    online,
    addItem,
    toggleItem,
    editItem,
    removeItem,
    addList,
    editList,
    removeList,
  };
}

function byPosition<T extends { position: number; createdAt: unknown }>(
  a: T,
  b: T,
) {
  if (a.position !== b.position) return a.position - b.position;
  return String(a.createdAt).localeCompare(String(b.createdAt));
}

function mergeChange<T extends { id: string }>(
  prev: T[],
  payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  },
  map: (row: Record<string, unknown>) => T,
): T[] {
  if (payload.eventType === "DELETE") {
    const id = payload.old.id as string;
    return prev.filter((r) => r.id !== id);
  }
  const row = map(payload.new);
  const exists = prev.some((r) => r.id === row.id);
  return exists ? prev.map((r) => (r.id === row.id ? row : r)) : [...prev, row];
}
