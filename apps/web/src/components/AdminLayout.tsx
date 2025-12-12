'use client';

import { ReactNode, useState } from 'react';
import ToastContainer from './ui/ToastContainer';
import SafeTime from './ui/SafeTime';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900">聚场管理后台</h1>
            <p className="text-sm text-gray-500 mt-1">Juchang Admin Console</p>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 space-y-2">
            {[
              { id: 'overview', name: '数据概览', icon: '📊', href: '/' },
              { id: 'users', name: '用户管理', icon: '👥', href: '/users' },
              { id: 'activities', name: '活动管理', icon: '🎯', href: '/activities' },
              { id: 'payments', name: '支付管理', icon: '💰', href: '/payments' },
              { id: 'disputes', name: '争议处理', icon: '⚖️', href: '/disputes' },
              { id: 'ai', name: 'AI 监控', icon: '🤖', href: '/ai' },
              { id: 'content', name: '内容审核', icon: '🔍', href: '/content' },
              { id: 'analytics', name: '数据分析', icon: '📈', href: '/analytics' },
              { id: 'settings', name: '系统设置', icon: '⚙️', href: '/settings' },
            ].map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </a>
            ))}
          </nav>

          {/* 底部信息 */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="text-xs text-gray-500">
              <p>版本 v1.0.0</p>
              <p>最后更新: <SafeTime format="date" fallback="--" /></p>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        {/* 顶部栏 */}
        <header className="bg-white px-6 py-4 lg:px-8 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <p className="text-sm text-gray-500">
                  <SafeTime format="date" fallback="加载中..." />
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 通知 */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.07 2.82l3.12 3.12M7 7l3 3M3 3l18 18" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"></div>
              </button>
              
              {/* 用户头像 */}
              <div className="relative">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">管</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="px-6 py-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toast 容器 */}
      <ToastContainer />
    </div>
  );
}