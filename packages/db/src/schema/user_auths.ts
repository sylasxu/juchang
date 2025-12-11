import { pgTable, uuid, varchar, timestamp, index, text } from "drizzle-orm/pg-core";
import { users } from "./users";
import { authProviderEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const userAuths = pgTable("user_auths", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  identityType: authProviderEnum("identity_type").default("wechat_miniprogram").notNull(),
  
  identifier: varchar("identifier", { length: 128 }).notNull(),
  
  credential: text("credential"), 
  
  extra: text("extra"),
  
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  lastLoginAt: timestamp("last_login_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("auth_identity_idx").on(t.identityType, t.identifier),
]);

export const insertUserAuthSchema = createInsertSchema(userAuths);
export const selectUserAuthSchema = createSelectSchema(userAuths);

export type UserAuth = typeof userAuths.$inferSelect;
export type NewUserAuth = typeof userAuths.$inferInsert;
