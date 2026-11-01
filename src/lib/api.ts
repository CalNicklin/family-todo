import { supabase } from "./supabase";
import type { List, Item } from "../db/schema";

export type { List, Item };

// supabase-js returns raw snake_case columns; map them to our camelCase shape
// at the boundary so the rest of the app speaks one language.
export function toList(row: Record<string, unknown>): List {
  return {
    id: row.id as string,
    name: row.name as string,
    emoji: row.emoji as string,
    position: row.position as number,
    createdAt: row.created_at as List["createdAt"],
  };
}

export function toItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    listId: row.list_id as string,
    text: row.text as string,
    checked: row.checked as boolean,
    position: row.position as number,
    createdAt: row.created_at as Item["createdAt"],
  };
}

export async function fetchBoard(): Promise<{ lists: List[]; items: Item[] }> {
  const [listsRes, itemsRes] = await Promise.all([
    supabase.from("lists").select("*"),
    supabase.from("items").select("*"),
  ]);
  if (listsRes.error) throw listsRes.error;
  if (itemsRes.error) throw itemsRes.error;
  return {
    lists: (listsRes.data ?? []).map(toList),
    items: (itemsRes.data ?? []).map(toItem),
  };
}

// Items ----------------------------------------------------------------------

export async function insertItem(row: {
  id: string;
  list_id: string;
  text: string;
  position: number;
}) {
  const { error } = await supabase.from("items").insert(row);
  if (error) throw error;
}

export async function setItemChecked(id: string, checked: boolean) {
  const { error } = await supabase.from("items").update({ checked }).eq("id", id);
  if (error) throw error;
}

export async function setItemText(id: string, text: string) {
  const { error } = await supabase.from("items").update({ text }).eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

// Lists ----------------------------------------------------------------------

export async function insertList(row: {
  id: string;
  name: string;
  emoji: string;
  position: number;
}) {
  const { error } = await supabase.from("lists").insert(row);
  if (error) throw error;
}

export async function updateList(
  id: string,
  patch: { name?: string; emoji?: string },
) {
  const { error } = await supabase.from("lists").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteList(id: string) {
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw error;
}
