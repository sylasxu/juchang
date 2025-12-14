// 数据库种子数据
import { config } from 'dotenv';
import { resolve } from 'path';

// 加载根目录的 .env 文件
config({ path: resolve(process.cwd(), '../../.env') });
import { db } from './db';
import { users } from './schema';

async function seed() {
  console.log('🌱 开始添加种子数据...');

  // 添加测试用户
  const testUsers = [
    {
      wxOpenId: 'test_user_001',
      phoneNumber: '13800138001',
      nickname: '张三',
      avatarUrl: 'https://via.placeholder.com/100x100?text=张三',
      bio: '热爱生活，喜欢交朋友',
      gender: 'male' as const,
      participationCount: 15,
      fulfillmentCount: 14,
      disputeCount: 0,
      activitiesCreatedCount: 5,
      membershipType: 'pro' as const,
      isRegistered: true,
      isBlocked: false,
    },
    {
      wxOpenId: 'test_user_002',
      phoneNumber: '13800138002',
      nickname: '李四',
      avatarUrl: 'https://via.placeholder.com/100x100?text=李四',
      bio: '喜欢运动和美食',
      gender: 'female' as const,
      participationCount: 8,
      fulfillmentCount: 8,
      disputeCount: 0,
      activitiesCreatedCount: 2,
      membershipType: 'free' as const,
      isRegistered: true,
      isBlocked: false,
    },
    {
      wxOpenId: 'test_user_003',
      phoneNumber: '13800138003',
      nickname: '王五',
      avatarUrl: 'https://via.placeholder.com/100x100?text=王五',
      bio: '新用户，刚刚注册',
      gender: 'unknown' as const,
      participationCount: 0,
      fulfillmentCount: 0,
      disputeCount: 0,
      activitiesCreatedCount: 0,
      membershipType: 'free' as const,
      isRegistered: false,
      isBlocked: false,
    },
    {
      wxOpenId: 'test_user_004',
      phoneNumber: '13800138004',
      nickname: '赵六',
      avatarUrl: 'https://via.placeholder.com/100x100?text=赵六',
      bio: '被封禁的用户',
      gender: 'male' as const,
      participationCount: 3,
      fulfillmentCount: 1,
      disputeCount: 2,
      activitiesCreatedCount: 0,
      membershipType: 'free' as const,
      isRegistered: true,
      isBlocked: true,
    },
    {
      wxOpenId: 'test_user_005',
      phoneNumber: '13800138005',
      nickname: '孙七',
      avatarUrl: 'https://via.placeholder.com/100x100?text=孙七',
      bio: 'Pro 会员，活跃用户',
      gender: 'female' as const,
      participationCount: 25,
      fulfillmentCount: 24,
      disputeCount: 0,
      activitiesCreatedCount: 8,
      membershipType: 'pro' as const,
      isRegistered: true,
      isBlocked: false,
    },
  ];

  try {
    const insertedUsers = await db.insert(users).values(testUsers).returning();
    console.log(`✅ 成功添加 ${insertedUsers.length} 个测试用户`);
    
    insertedUsers.forEach((user) => {
      console.log(`  - ${user.nickname} (${user.phoneNumber})`);
    });
  } catch (error) {
    console.error('❌ 添加种子数据失败:', error);
  }
}

// 如果直接运行此文件
if (import.meta.main) {
  await seed();
  process.exit(0);
}

export { seed };