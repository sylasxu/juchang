'use client';

import { useState, useEffect } from 'react';

interface SafeTimeProps {
  date?: Date | string;
  format?: 'time' | 'date' | 'datetime';
  fallback?: string;
  className?: string;
}

/**
 * 安全的时间显示组件
 * 避免 SSR 水合错误
 */
export default function SafeTime({ 
  date, 
  format = 'datetime', 
  fallback = '--', 
  className = '' 
}: SafeTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>{fallback}</span>;
  }

  const targetDate = date ? new Date(date) : new Date();

  const formatDate = () => {
    switch (format) {
      case 'time':
        return targetDate.toLocaleTimeString();
      case 'date':
        return targetDate.toLocaleDateString();
      case 'datetime':
        return targetDate.toLocaleString();
      default:
        return targetDate.toLocaleString();
    }
  };

  return <span className={className}>{formatDate()}</span>;
}