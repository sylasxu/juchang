import { useState, useEffect, useMemo, useCallback } from 'react'

interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number
    start: number
    end: number
    item: T
  }>
  totalHeight: number
  scrollToIndex: (index: number) => void
  containerProps: {
    style: React.CSSProperties
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  }
  innerProps: {
    style: React.CSSProperties
  }
}

/**
 * 虚拟滚动 Hook
 * 用于优化大数据量列表的渲染性能
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, containerHeight, overscan = 5 } = options
  const [scrollTop, setScrollTop] = useState(0)

  // 计算可见区域
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  // 生成虚拟项目
  const virtualItems = useMemo(() => {
    const result = []
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        item: items[i],
      })
    }
    return result
  }, [visibleRange, itemHeight, items])

  // 总高度
  const totalHeight = items.length * itemHeight

  // 滚动到指定索引
  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight
    setScrollTop(targetScrollTop)
  }, [itemHeight])

  // 滚动事件处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
      },
      onScroll: handleScroll,
    },
    innerProps: {
      style: {
        height: totalHeight,
        position: 'relative',
      },
    },
  }
}

/**
 * 无限滚动 Hook
 * 用于分页数据的无限加载
 */
interface InfiniteScrollOptions {
  threshold?: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

export function useInfiniteScroll({
  threshold = 100,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollOptions) {
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      
      if (
        scrollHeight - scrollTop - clientHeight < threshold &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage()
      }
    },
    [threshold, hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  return { onScroll: handleScroll }
}

/**
 * 搜索防抖 Hook
 * 用于优化搜索输入的性能
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 缓存 Hook
 * 用于缓存 API 请求结果
 */
interface CacheOptions {
  ttl?: number // 缓存时间（毫秒）
  maxSize?: number // 最大缓存条目数
}

export function useCache<T>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options
  const [cache, setCache] = useState<Map<string, { data: T; timestamp: number }>>(new Map())

  const get = useCallback((key: string): T | null => {
    const item = cache.get(key)
    if (!item) return null

    // 检查是否过期
    if (Date.now() - item.timestamp > ttl) {
      cache.delete(key)
      return null
    }

    return item.data
  }, [cache, ttl])

  const set = useCallback((key: string, data: T) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache)
      
      // 如果缓存已满，删除最旧的条目
      if (newCache.size >= maxSize) {
        const firstKey = newCache.keys().next().value
        if (firstKey) {
          newCache.delete(firstKey)
        }
      }

      newCache.set(key, { data, timestamp: Date.now() })
      return newCache
    })
  }, [maxSize])

  const clear = useCallback(() => {
    setCache(new Map())
  }, [])

  const remove = useCallback((key: string) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache)
      newCache.delete(key)
      return newCache
    })
  }, [])

  return { get, set, clear, remove }
}