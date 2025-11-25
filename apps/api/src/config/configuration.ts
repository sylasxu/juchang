export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    
    // 数据库配置 (虽然 API 不直接连，但保留配置项是个好习惯)
    database: {
      url: process.env.DATABASE_URL,
    },
  
    // JWT 配置
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d', // Token 默认有效期
    },
  
    // 微信小程序配置
    wechat: {
      appId: process.env.WECHAT_APP_ID,
      appSecret: process.env.WECHAT_APP_SECRET,
    },
    
    // 运行环境
    isDev: process.env.NODE_ENV === 'development',
  });