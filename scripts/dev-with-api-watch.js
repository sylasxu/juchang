#!/usr/bin/env node

/**
 * 完整开发环境启动脚本
 * 同时启动 API 服务器和 API 变更监听
 */

import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// 子进程列表
const processes = []

/**
 * 启动子进程
 */
function startProcess(name, command, args, options = {}) {
  console.log(`🚀 启动 ${name}...`)
  
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    ...options,
  })

  child.on('error', (error) => {
    console.error(`❌ ${name} 启动失败:`, error.message)
  })

  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`⚠️  ${name} 退出，退出码: ${code}`)
    }
  })

  processes.push({ name, child })
  return child
}

/**
 * 优雅退出
 */
function gracefulShutdown() {
  console.log('\n👋 正在关闭所有服务...')
  
  processes.forEach(({ name, child }) => {
    console.log(`🛑 关闭 ${name}`)
    child.kill('SIGTERM')
  })

  // 强制退出
  setTimeout(() => {
    console.log('🔥 强制退出')
    process.exit(0)
  }, 5000)
}

/**
 * 主函数
 */
async function main() {
  console.log('🎯 启动完整开发环境...\n')

  // 1. 启动 API 服务器
  startProcess(
    'API 服务器',
    'bun',
    ['run', 'dev:api']
  )

  // 等待 API 服务器启动
  console.log('⏳ 等待 API 服务器启动...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 2. 启动 API 变更监听
  startProcess(
    'API 变更监听器',
    'node',
    ['scripts/watch-api-changes.js']
  )

  console.log('\n✅ 开发环境启动完成!')
  console.log('📝 现在你可以:')
  console.log('   - 修改 API 代码，小程序 API 会自动重新生成')
  console.log('   - 在微信开发者工具中打开 apps/miniprogram')
  console.log('   - 使用生成的类型安全 API 进行开发')
  console.log('\n按 Ctrl+C 退出\n')

  // 监听退出信号
  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
}

// 启动
main().catch((error) => {
  console.error('❌ 启动失败:', error.message)
  process.exit(1)
})