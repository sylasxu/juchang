#!/usr/bin/env node

/**
 * 环境配置文件生成工具
 * 根据用户选择的环境类型创建对应的配置文件
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色输出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// 预设环境配置
const environments = {
  development: {
    name: '开发环境',
    description: '本地开发使用',
    overrides: {
      NODE_ENV: 'development',
      DEBUG: 'true',
      API_PORT: '3000',
      API_BASE_URL: 'http://localhost:3000'
    }
  },
  test: {
    name: '测试环境',
    description: '测试服务器使用',
    overrides: {
      NODE_ENV: 'test',
      DEBUG: 'false',
      API_PORT: '3001',
      API_BASE_URL: 'http://localhost:3001'
    }
  },
  production: {
    name: '生产环境',
    description: '生产环境使用',
    overrides: {
      NODE_ENV: 'production',
      DEBUG: 'false'
    }
  },
  docker: {
    name: 'Docker环境',
    description: 'Docker容器使用',
    overrides: {
      NODE_ENV: 'development',
      DEBUG: 'true',
      DATABASE_URL: 'postgresql://postgres:postgres@postgres:5432/juchang',
      REDIS_URL: 'redis://redis:6379'
    }
  }
};

// 生成随机密钥
function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成随机密码
function generatePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 读取现有配置
function readEnvExample() {
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    throw new Error('.env.example 文件不存在');
  }
  return fs.readFileSync(envExamplePath, 'utf8');
}

// 解析环境变量文件
function parseEnvFile(content) {
  const config = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;
    
    const key = trimmed.substring(0, equalIndex).trim();
    let value = trimmed.substring(equalIndex + 1).trim();
    
    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    config[key] = value;
  }
  
  return config;
}

// 生成新的环境配置
function generateEnvConfig(baseConfig, environment, options = {}) {
  const envConfig = { ...baseConfig };
  const envPreset = environments[environment];
  
  // 应用预设覆盖
  if (envPreset.overrides) {
    Object.assign(envConfig, envPreset.overrides);
  }
  
  // 生成安全密钥
  if (options.generateSecrets) {
    envConfig.JWT_SECRET = generateRandomString(64);
    envConfig.WECHAT_APP_SECRET = generateRandomString(32);
    envConfig.AI_API_KEY = generateRandomString(48);
  }
  
  // 生成安全密码
  if (options.generatePasswords) {
    const dbPassword = generatePassword();
    envConfig.POSTGRES_PASSWORD = dbPassword;
    envConfig.DATABASE_URL = envConfig.DATABASE_URL.replace(
      'your_secure_password_here',
      dbPassword
    );
  }
  
  // Docker环境特殊处理
  if (environment === 'docker') {
    envConfig.POSTGRES_PASSWORD = envConfig.POSTGRES_PASSWORD || generatePassword();
    envConfig.DATABASE_URL = `postgresql://postgres:${envConfig.POSTGRES_PASSWORD}@postgres:5432/juchang`;
  }
  
  return envConfig;
}

// 格式化环境变量文件
function formatEnvFile(config) {
  const lines = ['# ==========================================',
                '# Juchang Application Environment Variables',
                `# Generated on: ${new Date().toLocaleString()}`,
                `# Environment: ${config.NODE_ENV || 'unknown'}`,
                '# ==========================================',
                ''];
  
  const categories = {
    'Database Configuration': ['DATABASE_URL', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_PORT'],
    'Redis Configuration': ['REDIS_URL', 'REDIS_PORT', 'REDIS_PASSWORD'],
    'API Configuration': ['API_PORT', 'API_BASE_URL'],
    'WeChat Mini Program Configuration': ['WECHAT_APP_ID', 'WECHAT_APP_SECRET'],
    'AI Service Configuration': ['AI_API_KEY', 'AI_BASE_URL'],
    'File Upload Configuration': ['UPLOAD_MAX_SIZE', 'UPLOAD_ALLOWED_TYPES'],
    'Security Configuration': ['JWT_SECRET', 'JWT_EXPIRES_IN'],
    'Environment': ['NODE_ENV', 'DEBUG']
  };
  
  for (const [category, keys] of Object.entries(categories)) {
    const hasKeys = keys.some(key => config[key] !== undefined);
    if (hasKeys) {
      lines.push(`# ${category}`);
      for (const key of keys) {
        if (config[key] !== undefined) {
          const value = config[key];
          const isSensitive = key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY');
          const displayValue = isSensitive && value && value !== 'your_secure_password_here' 
            ? `${value.substring(0, 4)}...${value.slice(-4)}` 
            : value;
          lines.push(`${key}=${value}`);
        }
      }
      lines.push('');
    }
  }
  
  return lines.join('\n').trim();
}

// 交互式选择环境
async function selectEnvironment() {
  console.log('\n' + colors.blue + '🎯 选择要创建的环境类型：' + colors.reset);
  
  const choices = Object.entries(environments).map(([key, env]) => ({
    key,
    name: env.name,
    description: env.description
  }));
  
  choices.forEach((choice, index) => {
    console.log(`${colors.yellow}${index + 1}.${colors.reset} ${choice.name} - ${choice.description}`);
  });
  
  return new Promise((resolve) => {
    rl.question('\n请选择 (1-' + choices.length + '): ', (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < choices.length) {
        resolve(choices[index].key);
      } else {
        console.log(colors.red + '无效选择，使用默认开发环境' + colors.reset);
        resolve('development');
      }
    });
  });
}

// 交互式选项
async function selectOptions() {
  const options = {
    generateSecrets: false,
    generatePasswords: false
  };
  
  return new Promise((resolve) => {
    console.log('\n' + colors.blue + '⚙️  配置选项：' + colors.reset);
    
    rl.question('是否生成安全密钥? (y/N): ', (answer) => {
      options.generateSecrets = answer.toLowerCase() === 'y';
      
      rl.question('是否生成数据库密码? (y/N): ', (answer) => {
        options.generatePasswords = answer.toLowerCase() === 'y';
        resolve(options);
      });
    });
  });
}

// 主函数
async function main() {
  try {
    console.log('\n' + colors.green + '🚀 Juchang 环境配置生成工具' + colors.reset);
    console.log(colors.blue + '================================' + colors.reset);
    
    // 检查参数模式
    const args = process.argv.slice(2);
    let environment, options = {};
    
    if (args.length > 0) {
      // 命令行模式
      const envArg = args[0];
      if (environments[envArg]) {
        environment = envArg;
        options = {
          generateSecrets: args.includes('--secrets') || args.includes('-s'),
          generatePasswords: args.includes('--passwords') || args.includes('-p')
        };
      } else {
        console.log(colors.red + `错误：未知环境 '${envArg}'` + colors.reset);
        console.log('可用环境：' + Object.keys(environments).join(', '));
        process.exit(1);
      }
    } else {
      // 交互模式
      environment = await selectEnvironment();
      options = await selectOptions();
    }
    
    // 读取基础配置
    console.log('\n' + colors.yellow + '📖 读取基础配置...' + colors.reset);
    const envExample = readEnvExample();
    const baseConfig = parseEnvFile(envExample);
    
    // 生成新配置
    console.log(colors.yellow + `🔧 生成 ${environments[environment].name} 配置...` + colors.reset);
    const newConfig = generateEnvConfig(baseConfig, environment, options);
    
    // 确定输出文件名
    const outputFile = environment === 'development' ? '.env' : `.env.${environment}`;
    
    // 检查文件是否存在
    if (fs.existsSync(outputFile)) {
      return new Promise((resolve) => {
        rl.question(`\n${colors.yellow}⚠️  文件 ${outputFile} 已存在，是否覆盖? (y/N): ${colors.reset}`, (answer) => {
          if (answer.toLowerCase() === 'y') {
            writeConfig(outputFile, newConfig);
          } else {
            console.log(colors.blue + '操作已取消' + colors.reset);
          }
          resolve();
        });
      });
    } else {
      writeConfig(outputFile, newConfig);
    }
    
  } catch (error) {
    console.error(colors.red + '❌ 错误：' + error.message + colors.reset);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function writeConfig(outputFile, newConfig) {
  const formattedContent = formatEnvFile(newConfig);
  fs.writeFileSync(outputFile, formattedContent);
  
  console.log('\n' + colors.green + `✅ 环境配置文件已创建：${outputFile}` + colors.reset);
  console.log(colors.blue + '\n📋 配置摘要：' + colors.reset);
  console.log(`   环境：${newConfig.NODE_ENV}`);
  console.log(`   数据库：${newConfig.POSTGRES_DB || 'juchang'}`);
  console.log(`   API端口：${newConfig.API_PORT}`);
  
  if (newConfig.JWT_SECRET && newConfig.JWT_SECRET !== 'your_jwt_secret_key_here') {
    console.log(`   JWT密钥：已生成 (${newConfig.JWT_SECRET.length}位)`);
  }
  
  console.log('\n' + colors.yellow + '💡 提示：' + colors.reset);
  console.log('   - 请检查并修改配置文件中的占位符值');
  console.log('   - 敏感信息已用...隐藏显示');
  console.log(`   - 使用：source ${outputFile} 或直接在代码中加载`);
}

// 帮助信息
function showHelp() {
  console.log(`
${colors.green}Juchang 环境配置生成工具${colors.reset}

${colors.yellow}用法：${colors.reset}
  node create-env.js [环境] [选项]

${colors.yellow}环境：${colors.reset}
${Object.entries(environments).map(([key, env]) => 
  `  ${key.padEnd(12)} ${env.name} - ${env.description}`
).join('\n')}

${colors.yellow}选项：${colors.reset}
  --secrets, -s     生成安全密钥
  --passwords, -p   生成数据库密码
  --help, -h        显示帮助信息

${colors.yellow}示例：${colors.reset}
  node create-env.js                    # 交互模式
  node create-env.js development --secrets --passwords
  node create-env.js production --secrets
`);
}

// 处理帮助参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 运行主函数
main().catch(console.error);