import { pgTable, uuid, varchar, text, smallint, date, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { geometry } from './types';

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
  location: (geometry('point', 4326) as any).notNull(), // 二维点
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
export const userInsertSchema = createInsertSchema(users);
export const userUpdateSchema = createUpdateSchema(users);
export const userSelectSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
