#!/usr/bin/env node

/**
 * 清洁的 API 开发服务器启动脚本
 * 减少 Bun 的文件监听警告
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

const apiDir = resolve(process.cwd(), 'apps/api');

console.log('🚀 启动 JuChang API 开发服务器...\n');

// 启动 API 服务器，过滤掉文件监听警告
const apiProcess = spawn('bun', ['run', '--watch', '--silent', 'src/index.ts'], {
  cwd: apiDir,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '1' }
});

// 过滤输出，只显示重要信息
apiProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // 过滤掉文件监听警告
  if (!output.includes('is not in the project directory and will not be watched')) {
    process.stdout.write(output);
  }
});

apiProcess.stderr.on('data', (data) => {
  const output = data.toString();
  
  // 过滤掉文件监听警告
  if (!output.includes('is not in the project directory and will not be watched')) {
    process.stderr.write(output);
  }
});

apiProcess.on('close', (code) => {
  console.log(`\n📴 API 服务器已停止 (退出码: ${code})`);
  process.exit(code);
});

// 处理进程终止
process.on('SIGINT', () => {
  console.log('\n🛑 正在停止 API 服务器...');
  apiProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  apiProcess.kill('SIGTERM');
});