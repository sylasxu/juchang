// Transaction Service - 支付交易业务逻辑
import { db, transactions, activities, users, eq, and, desc, count } from '@juchang/db';
import type { CreateTransactionRequest, TransactionListQuery, WxPayCallback } from './transaction.model';

// 产品价格配置
const PRODUCT_PRICES = {
  boost: 300,        // ¥3.00
  pin_plus: 500,     // ¥5.00
  fast_pass: 200,    // ¥2.00
  ai_report: 100,    // ¥1.00
  ai_pack: 500,      // ¥5.00 (10次)
  pro_monthly: 1500, // ¥15.00
} as const;

const PRODUCT_NAMES = {
  boost: '强力召唤',
  pin_plus: '黄金置顶',
  fast_pass: '优先入场券',
  ai_report: 'AI深度风控报告',
  ai_pack: 'AI额度包(10次)',
  pro_monthly: 'Pro会员(月费)',
} as const;

/**
 * 创建交易订单
 */
export async function createTransaction(data: CreateTransactionRequest, userId: string) {
  const productType = data.productType;
  const amount = PRODUCT_PRICES[productType];
  const productName = PRODUCT_NAMES[productType];

  if (!amount) {
    throw new Error('无效的产品类型');
  }

  // 生成商户订单号（幂等键）
  const outTradeNo = `JC${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();

  // 创建交易记录
  const [transaction] = await db
    .insert(transactions)
    .values({
      userId,
      productType,
      productName,
      amount,
      outTradeNo,
      relatedId: data.relatedId,
      metadata: data.metadata,
      status: 'pending',
    })
    .returning();

  // 调用微信支付API（这里是模拟）
  const paymentParams = await createWxPayOrder({
    outTradeNo,
    amount,
    description: productName,
    userId,
  });

  return {
    transactionId: transaction.id,
    paymentParams,
  };
}

/**
 * 获取交易列表
 */
export async function getTransactionList(query: TransactionListQuery, userId: string) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const offset = (page - 1) * limit;

  // 构建查询条件
  let whereCondition = eq(transactions.userId, userId);
  
  if (query.status) {
    whereCondition = and(whereCondition, eq(transactions.status, query.status));
  }
  
  if (query.productType) {
    whereCondition = and(whereCondition, eq(transactions.productType, query.productType));
  }

  // 查询数据
  const [data, [{ total }]] = await Promise.all([
    db.select()
      .from(transactions)
      .where(whereCondition)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() })
      .from(transactions)
      .where(whereCondition),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 处理微信支付回调
 */
export async function handleWxPayCallback(callbackData: WxPayCallback) {
  const { out_trade_no, transaction_id, trade_state } = callbackData;

  // 查找交易记录
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.outTradeNo, out_trade_no))
    .limit(1);

  if (!transaction) {
    throw new Error('交易记录不存在');
  }

  if (transaction.status !== 'pending') {
    // 已处理过，直接返回成功（幂等性）
    return { success: true, message: '交易已处理' };
  }

  // 更新交易状态
  const newStatus = trade_state === 'SUCCESS' ? 'paid' : 'failed';
  
  await db.transaction(async (tx) => {
    // 1. 更新交易状态
    await tx
      .update(transactions)
      .set({
        status: newStatus,
        transactionId: transaction_id,
        callbackData,
        paidAt: newStatus === 'paid' ? new Date() : null,
      })
      .where(eq(transactions.id, transaction.id));

    // 2. 如果支付成功，下发权益
    if (newStatus === 'paid') {
      await grantUserBenefit(tx, transaction);
    }
  });

  return { success: true, message: '回调处理成功' };
}

/**
 * 下发用户权益
 */
async function grantUserBenefit(tx: any, transaction: any) {
  const { userId, productType, relatedId, metadata } = transaction;

  switch (productType) {
    case 'boost':
      // 强力召唤：更新活动状态
      if (relatedId) {
        await tx
          .update(activities)
          .set({
            isBoosted: true,
            boostExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时
            boostCount: db.sql`boost_count + 1`,
          })
          .where(eq(activities.id, relatedId));
      }
      break;

    case 'pin_plus':
      // 黄金置顶：更新活动状态
      if (relatedId) {
        await tx
          .update(activities)
          .set({
            isPinPlus: true,
            pinPlusExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时
          })
          .where(eq(activities.id, relatedId));
      }
      break;

    case 'ai_pack':
      // AI额度包：增加用户AI额度
      await tx
        .update(users)
        .set({
          aiCreateQuotaToday: db.sql`ai_create_quota_today + 10`,
          aiSearchQuotaToday: db.sql`ai_search_quota_today + 10`,
        })
        .where(eq(users.id, userId));
      break;

    case 'pro_monthly':
      // Pro会员：更新会员状态
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      await tx
        .update(users)
        .set({
          membershipType: 'pro',
          membershipExpiresAt: expiresAt,
        })
        .where(eq(users.id, userId));
      break;

    // fast_pass 和 ai_report 在使用时处理，这里不需要特殊逻辑
  }
}

/**
 * 创建微信支付订单（模拟实现）
 */
async function createWxPayOrder(params: {
  outTradeNo: string;
  amount: number;
  description: string;
  userId: string;
}) {
  // 这里应该调用微信支付API
  // 返回小程序支付所需的参数
  return {
    appId: process.env.WECHAT_APP_ID || 'wx1234567890',
    timeStamp: Math.floor(Date.now() / 1000).toString(),
    nonceStr: Math.random().toString(36).substr(2, 15),
    package: `prepay_id=wx${Date.now()}`,
    signType: 'RSA',
    paySign: 'mock_pay_sign_' + Math.random().toString(36).substr(2, 10),
  };
}