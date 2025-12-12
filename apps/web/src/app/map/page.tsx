'use client';

import { useState, useEffect } from 'react';

// 模拟活动数据
const mockActivities = [
  {
    id: '1',
    title: '周末火锅局',
    type: 'food',
    startAt: '2025-12-14T19:00:00Z',
    maxParticipants: 4,
    currentParticipants: 2,
    feeType: 'aa',
    estimatedCost: 80,
    location: [106.5516, 29.5630], // 重庆观音桥
    creator: {
      id: '1',
      nickname: '火锅达人',
      avatarUrl: null,
    },
    isBoosted: false,
    isPinPlus: true,
  },
  {
    id: '2',
    title: '夜跑小分队',
    type: 'sports',
    startAt: '2025-12-13T20:00:00Z',
    maxParticipants: 6,
    currentParticipants: 4,
    feeType: 'free',
    estimatedCost: 0,
    location: [106.5770, 29.5647], // 重庆解放碑
    creator: {
      id: '2',
      nickname: '跑步爱好者',
      avatarUrl: null,
    },
    isBoosted: true,
    isPinPlus: false,
  },
];

export default function MapPage() {
  const [activities, setActivities] = useState(mockActivities);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // 获取用户位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.log('获取位置失败:', error);
          // 默认使用重庆市中心
          setUserLocation([106.5516, 29.5630]);
        }
      );
    } else {
      // 默认使用重庆市中心
      setUserLocation([106.5516, 29.5630]);
    }
  }, []);

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'food':
        return '🍲';
      case 'sports':
        return '🏃';
      case 'entertainment':
        return '🎮';
      case 'study':
        return '📚';
      default:
        return '📍';
    }
  };

  const getFeeTypeText = (feeType: string, cost: number) => {
    switch (feeType) {
      case 'free':
        return '免费';
      case 'aa':
        return `AA制 ~¥${cost}`;
      case 'treat':
        return '请客';
      default:
        return '费用待定';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">聚场地图</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                + 创建活动
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* 地图区域 */}
        <div className="flex-1 relative bg-gray-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-gray-600 mb-2">地图组件占位</p>
              <p className="text-sm text-gray-500">
                {userLocation 
                  ? `当前位置: ${userLocation[1].toFixed(4)}, ${userLocation[0].toFixed(4)}`
                  : '正在获取位置...'
                }
              </p>
            </div>
          </div>

          {/* 模拟地图上的活动Pin */}
          <div className="absolute top-20 left-20">
            <button 
              onClick={() => setSelectedActivity(activities[0])}
              className={`relative ${activities[0].isPinPlus ? 'transform scale-125' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                activities[0].isPinPlus ? 'bg-yellow-500 ring-4 ring-yellow-300' : 'bg-orange-500'
              }`}>
                {getActivityTypeIcon(activities[0].type)}
              </div>
              {activities[0].isBoosted && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">🔥</span>
                </div>
              )}
            </button>
          </div>

          <div className="absolute top-32 right-32">
            <button 
              onClick={() => setSelectedActivity(activities[1])}
              className={`relative ${activities[1].isPinPlus ? 'transform scale-125' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                activities[1].isPinPlus ? 'bg-yellow-500 ring-4 ring-yellow-300' : 'bg-orange-500'
              }`}>
                {getActivityTypeIcon(activities[1].type)}
              </div>
              {activities[1].isBoosted && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs text-white">🔥</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          {selectedActivity ? (
            /* 活动详情 */
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{selectedActivity.title}</h2>
                <button 
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(selectedActivity.startAt).toLocaleString('zh-CN')}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  {selectedActivity.currentParticipants}/{selectedActivity.maxParticipants} 人
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  {getFeeTypeText(selectedActivity.feeType, selectedActivity.estimatedCost)}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedActivity.creator.nickname}</p>
                    <p className="text-xs text-gray-500">发起人</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700">
                  立即报名
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50">
                  查看详情
                </button>
              </div>
            </div>
          ) : (
            /* 活动列表 */
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">附近活动</h2>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div 
                    key={activity.id}
                    onClick={() => setSelectedActivity(activity)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                      <div className="flex items-center space-x-1">
                        {activity.isBoosted && <span className="text-xs">🔥</span>}
                        {activity.isPinPlus && <span className="text-xs">👑</span>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {activity.currentParticipants}/{activity.maxParticipants} 人 · {getFeeTypeText(activity.feeType, activity.estimatedCost)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.startAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}