// Admin Transaction Service - 管理后台交易管理业务逻辑
import { 
  db, 
  transactions, 
  users, 
  activities, 
  eq, 
  and, 
  or, 
  desc, 
  asc, 
  count, 
  sum, 
  sql,
  gte,
  lte,
  ilike,
  inArray
} from '@juchang/db';
import type { 
  AdminTransactionFilterQuery, 
  RefundRequest, 
  RevenueAnalyticsQuery 
} from './admin-transaction.model';

/**
 * 获取管理员交易列表
 */
export async function getAdminTransactionList(query: AdminTransactionFilterQuery) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const offset = (page - 1) * limit;

  // 构建查询条件
  const conditions = [];
  
  // 搜索条件（用户昵称、手机号、订单号）
  if (query.search) {
    const searchTerm = `%${query.search}%`;
    conditions.push(
      or(
        ilike(users.nickname, searchTerm),
        ilike(users.phoneNumber, searchTerm),
        ilike(transactions.outTradeNo, searchTerm)
      )
    );
  }

  // 状态筛选
  if (query.status && query.status.length > 0) {
    conditions.push(inArray(transactions.status, query.status));
  }

  // 产品类型筛选
  if (query.productType && query.productType.length > 0) {
    conditions.push(inArray(transactions.productType, query.productType));
  }

  // 金额范围筛选
  if (query.amountRange) {
    if (query.amountRange.min !== undefined) {
      conditions.push(gte(transactions.amount, query.amountRange.min));
    }
    if (query.amountRange.max !== undefined) {
      conditions.push(lte(transactions.amount, query.amountRange.max));
    }
  }

  // 日期范围筛选
  if (query.dateRange) {
    conditions.push(gte(transactions.createdAt, query.dateRange.start));
    conditions.push(lte(transactions.createdAt, query.dateRange.end));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  // 排序
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder || 'desc';
  const orderBy = sortOrder === 'desc' ? desc(transactions[sortBy]) : asc(transactions[sortBy]);

  // 查询数据
  const [data, [{ total }], [summary]] = await Promise.all([
    // 主查询 - 获取交易列表及关联信息
    db.select({
      // 交易基础信息
      id: transactions.id,
      userId: transactions.userId,
      productType: transactions.productType,
      productName: transactions.productName,
      amount: transactions.amount,
      status: transactions.status,
      outTradeNo: transactions.outTradeNo,
      transactionId: transactions.transactionId,
      relatedId: transactions.relatedId,
      metadata: transactions.metadata,
      callbackData: transactions.callbackData,
      errorMessage: transactions.errorMessage,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      
      // 用户信息
      userId_user: users.id,
      userNickname: users.nickname,
      userPhoneNumber: users.phoneNumber,
      
      // 关联活动信息
      activityId: activities.id,
      activityTitle: activities.title,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .leftJoin(activities, eq(transactions.relatedId, activities.id))
    .where(whereCondition)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset),

    // 总数查询
    db.select({ total: count() })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(whereCondition),

    // 汇总统计
    db.select({
      totalAmount: sum(transactions.amount),
      paidAmount: sum(sql`CASE WHEN ${transactions.status} = 'paid' THEN ${transactions.amount} ELSE 0 END`),
      refundedAmount: sum(sql`CASE WHEN ${transactions.status} = 'refunded' THEN ${transactions.amount} ELSE 0 END`),
      transactionCount: count(),
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(whereCondition),
  ]);

  return {
    data: data.map(item => ({
      // 交易基础信息
      id: item.id,
      userId: item.userId,
      productType: item.productType,
      productName: item.productName,
      amount: item.amount,
      status: item.status,
      outTradeNo: item.outTradeNo,
      transactionId: item.transactionId,
      relatedId: item.relatedId,
      metadata: item.metadata,
      callbackData: item.callbackData,
      errorMessage: item.errorMessage,
      paidAt: item.paidAt,
      createdAt: item.createdAt,
      
      // 扩展信息
      userInfo: item.userId_user ? {
        id: item.userId_user,
        nickname: item.userNickname,
        phoneNumber: item.userPhoneNumber,
      } : undefined,
      relatedActivityInfo: (item.activityId && item.activityTitle) ? {
        id: item.activityId,
        title: item.activityTitle,
      } : undefined,
      refundInfo: undefined, // TODO: 实现退款信息查询
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    summary: {
      totalAmount: Number(summary.totalAmount) || 0,
      paidAmount: Number(summary.paidAmount) || 0,
      refundedAmount: Number(summary.refundedAmount) || 0,
      transactionCount: summary.transactionCount,
    },
  };
}

/**
 * 获取交易详情
 */
export async function getAdminTransactionDetail(transactionId: string) {
  const [transactionData] = await db
    .select({
      // 交易基础信息
      id: transactions.id,
      userId: transactions.userId,
      productType: transactions.productType,
      productName: transactions.productName,
      amount: transactions.amount,
      status: transactions.status,
      outTradeNo: transactions.outTradeNo,
      transactionId: transactions.transactionId,
      relatedId: transactions.relatedId,
      metadata: transactions.metadata,
      callbackData: transactions.callbackData,
      errorMessage: transactions.errorMessage,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      
      // 用户完整信息
      userId_user: users.id,
      userNickname: users.nickname,
      userPhoneNumber: users.phoneNumber,
      userMembershipType: users.membershipType,
      userIsBlocked: users.isBlocked,
      userCreatedAt: users.createdAt,
      
      // 关联活动完整信息
      activityId: activities.id,
      activityTitle: activities.title,
      activityStatus: activities.status,
      activityCreatedAt: activities.createdAt,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .leftJoin(activities, eq(transactions.relatedId, activities.id))
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!transactionData) {
    throw new Error('交易记录不存在');
  }

  return {
    // 交易基础信息
    id: transactionData.id,
    userId: transactionData.userId,
    productType: transactionData.productType,
    productName: transactionData.productName,
    amount: transactionData.amount,
    status: transactionData.status,
    outTradeNo: transactionData.outTradeNo,
    transactionId: transactionData.transactionId,
    relatedId: transactionData.relatedId,
    metadata: transactionData.metadata,
    callbackData: transactionData.callbackData,
    errorMessage: transactionData.errorMessage,
    paidAt: transactionData.paidAt,
    createdAt: transactionData.createdAt,
    
    // 扩展信息
    userInfo: transactionData.userId_user ? {
      id: transactionData.userId_user,
      nickname: transactionData.userNickname,
      phoneNumber: transactionData.userPhoneNumber,
    } : undefined,
    relatedActivityInfo: (transactionData.activityId && transactionData.activityTitle) ? {
      id: transactionData.activityId,
      title: transactionData.activityTitle,
    } : undefined,
    refundInfo: undefined, // TODO: 实现退款信息查询
  };
}

/**
 * 处理退款
 */
export async function processRefund(refundData: RefundRequest, adminId: string) {
  const { transactionId, refundAmount, reason, adminNotes } = refundData;

  // 查找交易记录
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!transaction) {
    throw new Error('交易记录不存在');
  }

  if (transaction.status !== 'paid') {
    throw new Error('只能对已支付的交易进行退款');
  }

  if (refundAmount > transaction.amount) {
    throw new Error('退款金额不能超过交易金额');
  }

  // 执行退款操作
  await db.transaction(async (tx) => {
    // 1. 更新交易状态
    await tx
      .update(transactions)
      .set({
        status: 'refunded',
        metadata: {
          ...transaction.metadata,
          refund: {
            amount: refundAmount,
            reason,
            adminNotes,
            adminId,
            refundedAt: new Date().toISOString(),
          },
        },
      })
      .where(eq(transactions.id, transactionId));

    // 2. 撤销用户权益
    await revokeUserBenefit(tx, transaction);

    // TODO: 3. 调用微信退款API
    // await callWxRefundAPI(transaction.transactionId, refundAmount);
  });

  return { success: true, message: '退款处理成功' };
}

/**
 * 撤销用户权益
 */
async function revokeUserBenefit(tx: any, transaction: any) {
  const { userId, productType, relatedId } = transaction;

  switch (productType) {
    case 'boost':
      // 撤销强力召唤
      if (relatedId) {
        await tx
          .update(activities)
          .set({
            isBoosted: false,
            boostExpiresAt: null,
            boostCount: sql`GREATEST(boost_count - 1, 0)`,
          })
          .where(eq(activities.id, relatedId));
      }
      break;

    case 'pin_plus':
      // 撤销黄金置顶
      if (relatedId) {
        await tx
          .update(activities)
          .set({
            isPinPlus: false,
            pinPlusExpiresAt: null,
          })
          .where(eq(activities.id, relatedId));
      }
      break;

    case 'ai_pack':
      // 撤销AI额度包（如果还有剩余额度）
      await tx
        .update(users)
        .set({
          aiCreateQuotaToday: sql`GREATEST(ai_create_quota_today - 10, 0)`,
          aiSearchQuotaToday: sql`GREATEST(ai_search_quota_today - 10, 0)`,
        })
        .where(eq(users.id, userId));
      break;

    case 'pro_monthly':
      // 撤销Pro会员（需要谨慎处理）
      await tx
        .update(users)
        .set({
          membershipType: 'free',
          membershipExpiresAt: null,
        })
        .where(eq(users.id, userId));
      break;
  }
}

/**
 * 获取收入分析数据
 */
export async function getRevenueAnalytics(query: RevenueAnalyticsQuery) {
  const { period, startDate, endDate, productTypes, groupBy } = query;

  // 基础查询条件
  const conditions = [
    eq(transactions.status, 'paid'),
    gte(transactions.paidAt, startDate),
    lte(transactions.paidAt, endDate),
  ];

  if (productTypes && productTypes.length > 0) {
    conditions.push(inArray(transactions.productType, productTypes));
  }

  const whereCondition = and(...conditions);

  // 1. 总收入统计
  const [totalStats] = await db
    .select({
      totalRevenue: sum(transactions.amount),
      transactionCount: count(),
    })
    .from(transactions)
    .where(whereCondition);

  // 2. 按产品类型分组收入
  const revenueByProduct = await db
    .select({
      productType: transactions.productType,
      revenue: sum(transactions.amount),
      count: count(),
    })
    .from(transactions)
    .where(whereCondition)
    .groupBy(transactions.productType);

  // 3. 按时间周期分组收入
  const periodFormat = getPeriodFormat(period);
  const revenueByPeriod = await db
    .select({
      period: sql<string>`TO_CHAR(${transactions.paidAt}, ${periodFormat})`,
      revenue: sum(transactions.amount),
      transactionCount: count(),
      refundAmount: sum(sql`CASE WHEN ${transactions.status} = 'refunded' THEN ${transactions.amount} ELSE 0 END`),
    })
    .from(transactions)
    .where(whereCondition)
    .groupBy(sql`TO_CHAR(${transactions.paidAt}, ${periodFormat})`)
    .orderBy(sql`TO_CHAR(${transactions.paidAt}, ${periodFormat})`);

  // 4. 用户群体分析
  const userSegmentAnalysis = await getUserSegmentAnalysis(whereCondition);

  // 5. 趋势数据（按天）
  const trends = await db
    .select({
      date: sql<string>`DATE(${transactions.paidAt})`,
      revenue: sum(transactions.amount),
      transactions: count(),
      avgOrderValue: sql<number>`AVG(${transactions.amount})`,
    })
    .from(transactions)
    .where(whereCondition)
    .groupBy(sql`DATE(${transactions.paidAt})`)
    .orderBy(sql`DATE(${transactions.paidAt})`);

  return {
    totalRevenue: Number(totalStats.totalRevenue) || 0,
    revenueByProduct: revenueByProduct.reduce((acc, item) => {
      acc[item.productType] = Number(item.revenue) || 0;
      return acc;
    }, {} as Record<string, number>),
    revenueByPeriod: revenueByPeriod.map(item => ({
      period: String(item.period),
      revenue: Number(item.revenue) || 0,
      transactionCount: item.transactionCount,
      refundAmount: Number(item.refundAmount) || 0,
    })),
    conversionRates: {}, // TODO: 实现转化率计算
    userSegmentAnalysis,
    trends: trends.map(item => ({
      date: String(item.date),
      revenue: Number(item.revenue) || 0,
      transactions: item.transactions,
      avgOrderValue: Number(item.avgOrderValue) || 0,
    })),
  };
}

/**
 * 获取用户群体分析
 */
async function getUserSegmentAnalysis(whereCondition: any) {
  // 新用户：注册30天内的用户
  const [newUsers] = await db
    .select({
      revenue: sum(transactions.amount),
      count: count(),
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(
      and(
        whereCondition,
        gte(users.createdAt, sql`NOW() - INTERVAL '30 days'`)
      )
    );

  // 回头客：注册30天以上的用户
  const [returningUsers] = await db
    .select({
      revenue: sum(transactions.amount),
      count: count(),
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(
      and(
        whereCondition,
        lte(users.createdAt, sql`NOW() - INTERVAL '30 days'`)
      )
    );

  // Pro会员
  const [proMembers] = await db
    .select({
      revenue: sum(transactions.amount),
      count: count(),
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(
      and(
        whereCondition,
        eq(users.membershipType, 'pro')
      )
    );

  return {
    newUsers: {
      revenue: Number(newUsers.revenue) || 0,
      count: newUsers.count,
    },
    returningUsers: {
      revenue: Number(returningUsers.revenue) || 0,
      count: returningUsers.count,
    },
    proMembers: {
      revenue: Number(proMembers.revenue) || 0,
      count: proMembers.count,
    },
  };
}

/**
 * 获取时间周期格式
 */
function getPeriodFormat(period: string): string {
  switch (period) {
    case 'daily':
      return 'YYYY-MM-DD';
    case 'weekly':
      return 'YYYY-"W"WW';
    case 'monthly':
      return 'YYYY-MM';
    case 'yearly':
      return 'YYYY';
    default:
      return 'YYYY-MM-DD';
  }
}