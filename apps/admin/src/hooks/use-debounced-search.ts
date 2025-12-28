import { useState, useCallback, useRef, useEffect } from 'react'

interface UseDebouncedSearchOptions {
  /** 防抖延迟时间（毫秒），默认 300ms */
  delay?: number
  /** 初始值 */
  initialValue?: string
  /** 值变化时的回调 */
  onSearch?: (value: string) => void
}

interface UseDebouncedSearchReturn {
  /** 当前输入值（实时） */
  value: string
  /** 防抖后的搜索值 */
  debouncedValue: string
  /** 是否正在输入中文（IME 组合输入） */
  isComposing: boolean
  /** 输入框 onChange 处理函数 */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** 输入框 onCompositionStart 处理函数 */
  onCompositionStart: () => void
  /** 输入框 onCompositionEnd 处理函数 */
  onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void
  /** 清空搜索值 */
  clear: () => void
  /** 手动设置值 */
  setValue: (value: string) => void
  /** 输入框 props（可直接展开到 Input 组件） */
  inputProps: {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onCompositionStart: () => void
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void
  }
}

/**
 * 防抖搜索 Hook
 * 
 * 特性：
 * 1. 防抖：避免频繁触发搜索请求
 * 2. 中文输入兼容：在拼音输入过程中不触发搜索，等输入完成后再触发
 * 
 * @example
 * ```tsx
 * const { inputProps, debouncedValue } = useDebouncedSearch({
 *   delay: 300,
 *   onSearch: (value) => console.log('搜索:', value)
 * })
 * 
 * return <Input placeholder="搜索..." {...inputProps} />
 * ```
 */
export function useDebouncedSearch(
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchReturn {
  const { delay = 300, initialValue = '', onSearch } = options

  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const [isComposing, setIsComposing] = useState(false)
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSearchRef = useRef(onSearch)
  
  // 保持 onSearch 回调的最新引用
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // 触发防抖搜索
  const triggerDebouncedSearch = useCallback((newValue: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(newValue)
      onSearchRef.current?.(newValue)
    }, delay)
  }, [delay])

  // 输入变化处理
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // 如果不在中文输入过程中，触发防抖搜索
    if (!isComposing) {
      triggerDebouncedSearch(newValue)
    }
  }, [isComposing, triggerDebouncedSearch])

  // 中文输入开始
  const onCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  // 中文输入结束
  const onCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false)
    // 输入完成后，使用最终值触发搜索
    const newValue = e.currentTarget.value
    setValue(newValue)
    triggerDebouncedSearch(newValue)
  }, [triggerDebouncedSearch])

  // 清空
  const clear = useCallback(() => {
    setValue('')
    setDebouncedValue('')
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    onSearchRef.current?.('')
  }, [])

  // 手动设置值
  const setValueManually = useCallback((newValue: string) => {
    setValue(newValue)
    triggerDebouncedSearch(newValue)
  }, [triggerDebouncedSearch])

  return {
    value,
    debouncedValue,
    isComposing,
    onChange,
    onCompositionStart,
    onCompositionEnd,
    clear,
    setValue: setValueManually,
    inputProps: {
      value,
      onChange,
      onCompositionStart,
      onCompositionEnd,
    },
  }
}
