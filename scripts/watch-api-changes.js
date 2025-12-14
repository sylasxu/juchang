#!/usr/bin/env node

/**
 * API 变更监听脚本
 * 监听 API 服务器的变更，自动重新生成小程序 API 代码
 */

import { spawn } from 'child_process'
import { watch } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// 配置
const config = {
  // 监听的 API 目录
  apiDir: join(rootDir, 'apps/api/src'),
  // 小程序目录
  mpDir: join(rootDir, 'apps/miniprogram'),
  // 延迟时间（避免频繁重新生成）
  debounceMs: 2000,
  // API 服务器地址
  apiUrl: 'http://localhost:3000',
}

let debounceTimer = null
let isGenerating = false

/**
 * 检查 API 服务器是否运行
 */
async function checkApiServer() {
  try {
    const response = await fetch(`${config.apiUrl}/health`)
    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * 生成 API 代码
 */
async function generateApi() {
  if (isGenerating) {
    console.log('⏳ API 生成正在进行中，跳过...')
    return
  }

  isGenerating = true
  console.log('🔄 检测到 API 变更，开始重新生成小程序 API 代码...')

  // 检查 API 服务器状态
  const serverRunning = await checkApiServer()
  if (!serverRunning) {
    console.log('❌ API 服务器未运行，请先启动 API 服务器')
    isGenerating = false
    return
  }

  return new Promise((resolve) => {
    const child = spawn('bun', ['run', 'gen:api:mp'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    })

    child.on('close', (code) => {
      isGenerating = false
      if (code === 0) {
        console.log('✅ API 代码生成完成')
      } else {
        console.log(`❌ API 代码生成失败，退出码: ${code}`)
      }
      resolve()
    })

    child.on('error', (error) => {
      isGenerating = false
      console.error('❌ 生成过程出错:', error.message)
      resolve()
    })
  })
}

/**
 * 防抖处理
 */
function debouncedGenerate() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    generateApi()
  }, config.debounceMs)
}

/**
 * 启动监听
 */
function startWatching() {
  console.log('👀 开始监听 API 变更...')
  console.log(`📁 监听目录: ${config.apiDir}`)
  console.log(`⏱️  防抖延迟: ${config.debounceMs}ms`)
  console.log('💡 提示: 修改 API 代码后会自动重新生成小程序 API\n')

  try {
    const watcher = watch(
      config.apiDir,
      { recursive: true },
      (eventType, filename) => {
        if (!filename) return

        // 只监听 TypeScript 文件
        if (!filename.endsWith('.ts') && !filename.endsWith('.js')) {
          return
        }

        // 忽略测试文件和临时文件
        if (
          filename.includes('.test.') ||
          filename.includes('.spec.') ||
          filename.includes('.tmp') ||
          filename.includes('node_modules')
        ) {
          return
        }

        console.log(`📝 检测到文件变更: ${filename}`)
        debouncedGenerate()
      }
    )

    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\n👋 停止监听 API 变更')
      watcher.close()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      watcher.close()
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ 启动监听失败:', error.message)
    process.exit(1)
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 API 变更监听器启动中...\n')

  // 检查 API 服务器
  console.log('🔍 检查 API 服务器状态...')
  const serverRunning = await checkApiServer()
  
  if (!serverRunning) {
    console.log('⚠️  API 服务器未运行，但监听器仍会启动')
    console.log('💡 请确保在修改 API 后启动服务器\n')
  } else {
    console.log('✅ API 服务器运行正常\n')
  }

  // 首次生成（如果服务器运行）
  if (serverRunning) {
    console.log('🔄 执行首次 API 代码生成...')
    await generateApi()
    console.log('')
  }

  // 开始监听
  startWatching()
}

// 启动
main().catch((error) => {
  console.error('❌ 启动失败:', error.message)
  process.exit(1)
})