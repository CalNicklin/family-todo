import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  pgPolicy,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

// A board of lists shared by the whole family.
// RLS: only a signed-in (authenticated) session can touch anything. The public
// key alone gets nothing — the shared family login is the only way in.

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("📝"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [
    pgPolicy("authenticated can do anything to lists", {
      for: "all",
      to: authenticatedRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    checked: boolean("checked").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    pgPolicy("authenticated can do anything to items", {
      for: "all",
      to: authenticatedRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    // DB-level lock: an item's text must be unique within its list,
    // case-insensitive and ignoring surrounding spaces. Backs up the in-app
    // guard so duplicates are impossible even in a two-device race.
    uniqueIndex("items_list_text_ci_uniq").on(
      t.listId,
      sql`lower(btrim(${t.text}))`,
    ),
  ],
);

export type List = typeof lists.$inferSelect;
export type Item = typeof items.$inferSelect;
