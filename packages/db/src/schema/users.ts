import { pgTable, uuid, varchar, text, smallint, date, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';


export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  openid: varchar('openid', { length: 128 }).notNull().unique(),
  unionid: varchar('unionid', { length: 128 }),
  phone: varchar('phone', { length: 20 }),
  nickname: varchar('nickname', { length: 50 }),
  avatarUrl: text('avatar_url'),
  gender: smallint('gender'), // 0:未知, 1:男, 2:女
  birthday: date('birthday'),
  bio: text('bio'),
  location: jsonb('location'), // 使用 jsonb 存储位置信息 {latitude, longitude}
  locationPrecision: integer('location_precision').default(500), // 位置精度(米)
  creditScore: integer('credit_score').default(100),
  isVerified: boolean('is_verified').default(false),
  verificationType: varchar('verification_type', { length: 20 }), // 'id_card', 'student_card', 'work_card'
  privacyLevel: varchar('privacy_level', { length: 20 }).default('standard'), // 'public', 'friends', 'private'
  notificationSettings: jsonb('notification_settings').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 自动生成Zod模式
const userInsertSchema = createInsertSchema(users);
const userUpdateSchema = createUpdateSchema(users);

export const userSelectSchema = createSelectSchema(users);

// 创建用户请求模式（排除某些字段）
export const userCreateSchema = userInsertSchema.pick({
  openid: true,
  unionid: true,
  phone: true,
  nickname: true,
  avatarUrl: true,
  gender: true,
  birthday: true,
  bio: true,
  location: true,
  locationPrecision: true,
});

// 更新用户请求模式（所有字段都是可选的）
export const userUpdateSchema = userUpdateSchema.pick({
  nickname: true,
  avatarUrl: true,
  gender: true,
  birthday: true,
  bio: true,
  location: true,
  locationPrecision: true,
  privacyLevel: true,
});



export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
