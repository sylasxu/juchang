import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: 'http://localhost:3000/doc/json', // Elysia Swagger JSON 端点
    },
    output: {
      target: '../miniprogram/src/api/generated.ts', // 生成到小程序目录
      client: 'axios',
      override: {
        mutator: {
          path: '../miniprogram/src/api/client.ts', // 自定义请求适配器（适配 wx.request）
          name: 'customInstance',
        },
      },
    },
  },
});