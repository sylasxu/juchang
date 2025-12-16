import { db } from './db';
import { users, activities, participants, transactions } from './schema';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '../../.env' });

async function seed() {
  console.log('🌱 开始种子数据...');

  try {
    // 1. 创建测试用户
    console.log('👤 创建测试用户...');
    const testUsers = await db.insert(users).values([
      {
        wxOpenId: 'test_openid_001',
        nickname: '张三',
        avatarUrl: 'https://example.com/avatar1.jpg',
        gender: 'male',
        membershipType: 'free',
        aiCreateQuotaToday: 3,
        aiSearchQuotaToday: 10,
        participationCount: 5,
        fulfillmentCount: 5,
        disputeCount: 0,
        activitiesCreatedCount: 2,
        feedbackReceivedCount: 0,
        isRegistered: true,
      },
      {
        wxOpenId: 'test_openid_002', 
        nickname: '李四',
        avatarUrl: 'https://example.com/avatar2.jpg',
        gender: 'female',
        membershipType: 'pro',
        membershipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
        aiCreateQuotaToday: 999,
        aiSearchQuotaToday: 999,
        participationCount: 8,
        fulfillmentCount: 7,
        disputeCount: 1,
        activitiesCreatedCount: 3,
        feedbackReceivedCount: 1,
        isRegistered: true,
      },
      {
        wxOpenId: 'test_openid_003',
        nickname: '王五',
        avatarUrl: 'https://example.com/avatar3.jpg',
        gender: 'unknown',
        membershipType: 'free',
        aiCreateQuotaToday: 1,
        aiSearchQuotaToday: 5,
        participationCount: 2,
        fulfillmentCount: 1,
        disputeCount: 1,
        activitiesCreatedCount: 0,
        feedbackReceivedCount: 2,
        isRegistered: true,
      },
    ]).returning();

    console.log(`✅ 创建了 ${testUsers.length} 个测试用户`);

    // 2. 创建测试活动
    console.log('🎯 创建测试活动...');
    const testActivities = await db.insert(activities).values([
      {
        creatorId: testUsers[0].id,
        title: '周五火锅局',
        description: '观音桥附近吃火锅，AA制，欢迎加入！',
        location: { x: 106.5516, y: 29.5630 }, // 重庆观音桥坐标
        locationName: '观音桥步行街',
        address: '重庆市江北区观音桥步行街',
        locationHint: '4楼平台入口',
        startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
        endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 2天后+3小时
        type: 'food',
        maxParticipants: 4,
        currentParticipants: 2,
        feeType: 'aa',
        estimatedCost: 8000, // 80元
        joinMode: 'instant',
        riskLevel: 'low',
        riskScore: 5,
        tags: ['火锅', '观音桥', 'AA制'],
        status: 'published',
        chatStatus: 'active',
      },
      {
        creatorId: testUsers[1].id,
        title: '解放碑剧本杀',
        description: '6人本《长安十二时辰》，需要有经验的玩家',
        location: { x: 106.5804, y: 29.5647 }, // 重庆解放碑坐标
        locationName: '解放碑步行街',
        address: '重庆市渝中区解放碑步行街',
        locationHint: '地下B1层',
        startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
        endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 3天后+4小时
        type: 'entertainment',
        maxParticipants: 6,
        currentParticipants: 3,
        feeType: 'aa',
        estimatedCost: 12000, // 120元
        joinMode: 'approval',
        riskLevel: 'low',
        riskScore: 3,
        tags: ['剧本杀', '解放碑', '长安十二时辰'],
        genderRequirement: 'all',
        minReliabilityRate: 80,
        status: 'published',
        chatStatus: 'active',
        isPinPlus: true,
        pinPlusExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
      },
      {
        creatorId: testUsers[0].id,
        title: '南山夜跑团',
        description: '南山一棵树夜跑，约5公里，适合有跑步基础的朋友',
        location: { x: 106.6200, y: 29.5200 }, // 重庆南山坐标
        locationName: '南山一棵树观景台',
        address: '重庆市南岸区南山一棵树观景台',
        locationHint: '观景台停车场集合',
        startAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1天后
        endAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 1天后+2小时
        type: 'sports',
        maxParticipants: 8,
        currentParticipants: 1,
        feeType: 'free',
        estimatedCost: 0,
        joinMode: 'instant',
        riskLevel: 'medium',
        riskScore: 15,
        tags: ['跑步', '南山', '夜跑'],
        genderRequirement: 'all',
        status: 'published',
        chatStatus: 'active',
        isBoosted: true,
        boostExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12小时后
        boostCount: 1,
      },
      {
        creatorId: testUsers[1].id,
        title: '这里缺一个咖啡局 ☕',
        description: '运营推荐的需求锚点',
        location: { x: 106.5300, y: 29.5400 }, // 重庆大学城坐标
        locationName: '大学城商圈',
        address: '重庆市沙坪坝区大学城',
        locationHint: '轻轨站1号出口',
        startAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4天后
        endAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 4天后+2小时
        type: 'other',
        maxParticipants: 4,
        currentParticipants: 0,
        feeType: 'aa',
        estimatedCost: 3000, // 30元
        joinMode: 'instant',
        riskLevel: 'low',
        riskScore: 2,
        tags: ['咖啡', '大学城', '需求锚点'],
        status: 'published',
        chatStatus: 'active',
        isGhost: true,
        ghostAnchorType: 'demand',
        ghostSuggestedType: 'other',
      },
    ]).returning();

    console.log(`✅ 创建了 ${testActivities.length} 个测试活动`);

    // 3. 创建参与记录
    console.log('👥 创建参与记录...');
    const testParticipants = await db.insert(participants).values([
      {
        activityId: testActivities[0].id,
        userId: testUsers[1].id,
        status: 'approved',
        applicationMsg: '我很喜欢吃火锅，准时到达！',
      },
      {
        activityId: testActivities[1].id,
        userId: testUsers[0].id,
        status: 'pending',
        applicationMsg: '玩过很多本，经验丰富',
        isFastPass: true,
      },
      {
        activityId: testActivities[1].id,
        userId: testUsers[2].id,
        status: 'approved',
        applicationMsg: '新手，请多指教',
      },
    ]).returning();

    console.log(`✅ 创建了 ${testParticipants.length} 个参与记录`);

    // 4. 创建测试交易
    console.log('💰 创建测试交易...');
    const testTransactions = await db.insert(transactions).values([
      {
        userId: testUsers[1].id,
        productType: 'pin_plus',
        productName: '黄金置顶',
        amount: 500, // 5元
        status: 'paid',
        outTradeNo: 'JC' + Date.now() + 'TEST001',
        transactionId: 'wx_test_transaction_001',
        relatedId: testActivities[1].id,
        metadata: {
          activityId: testActivities[1].id,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        paidAt: new Date(),
      },
      {
        userId: testUsers[0].id,
        productType: 'boost',
        productName: '强力召唤',
        amount: 300, // 3元
        status: 'paid',
        outTradeNo: 'JC' + Date.now() + 'TEST002',
        transactionId: 'wx_test_transaction_002',
        relatedId: testActivities[2].id,
        metadata: {
          activityId: testActivities[2].id,
          validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        },
        paidAt: new Date(),
      },
    ]).returning();

    console.log(`✅ 创建了 ${testTransactions.length} 个测试交易`);

    console.log('🎉 种子数据创建完成！');
    console.log('\n📊 数据统计:');
    console.log(`- 用户: ${testUsers.length} 个`);
    console.log(`- 活动: ${testActivities.length} 个`);
    console.log(`- 参与记录: ${testParticipants.length} 个`);
    console.log(`- 交易记录: ${testTransactions.length} 个`);

  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ 种子数据脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 种子数据脚本执行失败:', error);
      process.exit(1);
    });
}

export { seed };