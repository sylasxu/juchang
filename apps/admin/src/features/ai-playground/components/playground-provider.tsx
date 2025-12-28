// Playground Context Provider
import { createContext, useContext, useState, type ReactNode } from 'react'

interface PlaygroundSettings {
  systemPrompt: string
  temperature: number
  maxTokens: number
}

interface PlaygroundContextType {
  settings: PlaygroundSettings
  updateSettings: (settings: Partial<PlaygroundSettings>) => void
  resetSettings: () => void
}

const defaultSettings: PlaygroundSettings = {
  systemPrompt: `你是聚场 AI 助手，帮助用户组织线下活动。
当用户描述活动需求时，提取以下信息：
- 活动类型（美食/运动/桌游/娱乐/其他）
- 时间
- 地点
- 人数限制
- 费用说明

如果信息不完整，友好地询问缺失的信息。
保持语气轻松友好，像朋友聊天一样。`,
  temperature: 0.7,
  maxTokens: 1024,
}

const PlaygroundContext = createContext<PlaygroundContextType | null>(null)

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlaygroundSettings>(defaultSettings)

  const updateSettings = (newSettings: Partial<PlaygroundSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <PlaygroundContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </PlaygroundContext.Provider>
  )
}

export function usePlayground() {
  const context = useContext(PlaygroundContext)
  if (!context) {
    throw new Error('usePlayground must be used within PlaygroundProvider')
  }
  return context
}
