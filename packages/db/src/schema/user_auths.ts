import { pgTable, uuid, varchar, timestamp, index, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { authProviderEnum } from "./enums";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { Type } from "@sinclair/typebox";

export const userAuths = pgTable("user_auths", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  /** 关联用户 */
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  /** 登录类型：枚举定义在 enums.authIdentityEnum */
  identityType: authProviderEnum("identity_type").default("wechat_miniprogram").notNull(),
  
  /** 标识符：对于微信是 OpenID，对于手机是 Phone */
  identifier: varchar("identifier", { length: 128 }).notNull(),
  
  /** 敏感凭证：对于微信是 session_key，对于手机是 hash 后的密码/验证码 */
  credential: text("credential"), 
  
  /** 扩展数据：存 UnionID 或其他 OAuth 信息 */
  extra: text("extra"), // JSON string
  
  /** 审计信息 */
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  lastLoginAt: timestamp("last_login_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  // 复合索引：快速通过 类型+标识符 找到用户
  index("auth_identity_idx").on(t.identityType, t.identifier),
]);

export const userAuthsRelations = relations(userAuths, ({ one }) => ({
  user: one(users, {
    fields: [userAuths.userId],
    references: [users.id],
  }),
}));

// TypeBox Schemas (使用 drizzle-typebox)
// 使用 Type.Object 重新包装，切断对 drizzle-typebox 内部文件的依赖
// 解决 TypeScript Monorepo 的 TS2742 错误
export const insertUserAuthSchema = Type.Object({
  ...createInsertSchema(userAuths).properties
});

export const selectUserAuthSchema = Type.Object({
  ...createSelectSchema(userAuths).properties
});

export type UserAuth = typeof userAuths.$inferSelect;
export type NewUserAuth = typeof userAuths.$inferInsert;