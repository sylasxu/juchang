// 模拟 API 数据，用于开发测试
import type { User, UserListResponse } from '@/hooks/useUsers';
import type { Activity, ActivityListResponse } from '@/hooks/useActivities';

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    nickname: '张三',
    phoneNumber: '138****1234',
    avatarUrl: undefined,
    participationCount: 28,
    fulfillmentCount: 27,
    membershipType: 'pro',
    isBlocked: false,
    createdAt: '2024-11-15T10:30:00Z',
    lastActiveAt: '2025-12-12T08:00:00Z'
  },
  {
    id: '2',
    nickname: '李四',
    phoneNumber: '139****5678',
    avatarUrl: undefined,
    participationCount: 15,
    fulfillmentCount: 10,
    membershipType: 'free',
    isBlocked: false,
    createdAt: '2024-10-22T14:20:00Z',
    lastActiveAt: '2025-12-11T20:15:00Z'
  },
  {
    id: '3',
    nickname: '王五',
    phoneNumber: '137****9012',
    avatarUrl: undefined,
    participationCount: 12,
    fulfillmentCount: 5,
    membershipType: 'free',
    isBlocked: true,
    createdAt: '2024-09-08T16:45:00Z',
    lastActiveAt: '2025-12-05T12:30:00Z'
  },
  {
    id: '4',
    nickname: '赵六',
    phoneNumber: '136****3456',
    avatarUrl: undefined,
    participationCount: 45,
    fulfillmentCount: 44,
    membershipType: 'pro',
    isBlocked: false,
    createdAt: '2024-08-12T09:15:00Z',
    lastActiveAt: '2025-12-12T10:45:00Z'
  },
  {
    id: '5',
    nickname: '孙七',
    phoneNumber: '135****7890',
    avatarUrl: undefined,
    participationCount: 8,
    fulfillmentCount: 3,
    membershipType: 'free',
    isBlocked: false,
    createdAt: '2024-12-01T11:20:00Z',
    lastActiveAt: '2025-12-10T15:30:00Z'
  }
];

// 模拟活动数据
const mockActivities: Activity[] = [
  {
    id: '1',
    title: '周末火锅局',
    description: '观音桥附近找几个小伙伴一起吃火锅，AA制',
    creatorId: '1',
    creator: {
      id: '1',
      nickname: '张三',
      avatarUrl: undefined
    },
    type: 'food',
    status: 'published',
    maxParticipants: 6,
    currentParticipants: 4,
    startAt: '2025-12-14T19:00:00Z',
    endAt: undefined,
    locationName: '观音桥步行街',
    address: '重庆市江北区观音桥步行街',
    location: [106.5516, 29.5630],
    feeType: 'aa',
    estimatedCost: 80,
    isBoosted: true,
    isPinPlus: false,
    isLocationBlurred: false,
    riskLevel: 'low',
    createdAt: '2025-12-12T14:30:00Z',
    updatedAt: '2025-12-12T14:30:00Z'
  },
  {
    id: '2',
    title: '夜跑小分队',
    description: '南滨路夜跑，锻炼身体，结识朋友',
    creatorId: '2',
    creator: {
      id: '2',
      nickname: '李四',
      avatarUrl: undefined
    },
    type: 'sports',
    status: 'completed',
    maxParticipants: 8,
    currentParticipants: 8,
    startAt: '2025-12-11T20:00:00Z',
    endAt: '2025-12-11T21:30:00Z',
    locationName: '南滨路',
    address: '重庆市南岸区南滨路',
    location: [106.5770, 29.5230],
    feeType: 'free',
    estimatedCost: 0,
    isBoosted: false,
    isPinPlus: false,
    isLocationBlurred: false,
    riskLevel: 'low',
    createdAt: '2025-12-10T16:20:00Z',
    updatedAt: '2025-12-11T21:30:00Z'
  },
  {
    id: '3',
    title: '剧本杀推理',
    description: '解放碑某剧本杀店，6人本，需要有经验的玩家',
    creatorId: '3',
    creator: {
      id: '3',
      nickname: '王五',
      avatarUrl: undefined
    },
    type: 'entertainment',
    status: 'disputed',
    maxParticipants: 6,
    currentParticipants: 6,
    startAt: '2025-12-10T14:00:00Z',
    endAt: '2025-12-10T18:00:00Z',
    locationName: '解放碑某剧本杀店',
    address: '重庆市渝中区解放碑步行街',
    location: [106.5770, 29.5647],
    feeType: 'aa',
    estimatedCost: 120,
    isBoosted: false,
    isPinPlus: true,
    isLocationBlurred: true,
    riskLevel: 'high',
    createdAt: '2025-12-09T10:15:00Z',
    updatedAt: '2025-12-10T18:30:00Z'
  }
];

// 模拟 API 延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟用户 API
export const mockUserApi = {
  async getUsers(filters: any = {}): Promise<UserListResponse> {
    await delay(800); // 模拟网络延迟
    
    let filteredUsers = [...mockUsers];
    
    // 搜索过滤
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.nickname.toLowerCase().includes(search) ||
        user.phoneNumber.includes(search)
      );
    }
    
    // 状态过滤
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'blocked') {
        filteredUsers = filteredUsers.filter(user => user.isBlocked);
      } else if (filters.status === 'active') {
        filteredUsers = filteredUsers.filter(user => !user.isBlocked);
      }
    }
    
    // 会员类型过滤
    if (filters.membershipType && filters.membershipType !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.membershipType === filters.membershipType);
    }
    
    // 分页
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return {
      data: paginatedUsers,
      total: filteredUsers.length,
      page,
      totalPages: Math.ceil(filteredUsers.length / limit)
    };
  },

  async blockUser(userId: string): Promise<void> {
    await delay(500);
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.isBlocked = true;
    }
  },

  async unblockUser(userId: string): Promise<void> {
    await delay(500);
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.isBlocked = false;
    }
  }
};

// 模拟活动 API
export const mockActivityApi = {
  async getActivities(filters: any = {}): Promise<ActivityListResponse> {
    await delay(600);
    
    let filteredActivities = [...mockActivities];
    
    // 搜索过滤
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredActivities = filteredActivities.filter(activity => 
        activity.title.toLowerCase().includes(search) ||
        activity.creator?.nickname.toLowerCase().includes(search)
      );
    }
    
    // 状态过滤
    if (filters.status && filters.status !== 'all') {
      filteredActivities = filteredActivities.filter(activity => activity.status === filters.status);
    }
    
    // 类型过滤
    if (filters.type && filters.type !== 'all') {
      filteredActivities = filteredActivities.filter(activity => activity.type === filters.type);
    }
    
    // 风险等级过滤
    if (filters.riskLevel && filters.riskLevel !== 'all') {
      filteredActivities = filteredActivities.filter(activity => activity.riskLevel === filters.riskLevel);
    }
    
    // 分页
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
    
    return {
      data: paginatedActivities,
      total: filteredActivities.length,
      page,
      totalPages: Math.ceil(filteredActivities.length / limit)
    };
  },

  async cancelActivity(activityId: string, reason?: string): Promise<void> {
    await delay(500);
    const activity = mockActivities.find(a => a.id === activityId);
    if (activity) {
      activity.status = 'cancelled';
    }
  },

  async resolveDispute(activityId: string, resolution: string): Promise<void> {
    await delay(500);
    const activity = mockActivities.find(a => a.id === activityId);
    if (activity) {
      activity.status = 'completed';
    }
  }
};