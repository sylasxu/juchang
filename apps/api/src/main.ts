import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // 默认就是 Express

async function bootstrap() {
  // 1. 不需要 new FastifyAdapter 了，默认就是 Express
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();

  // 2. 针对微信支付的 XML 处理 (Express 专属优雅写法)
  // pnpm add body-parser-xml
  const bodyParserXml = require('body-parser-xml');
  bodyParserXml(app.getHttpAdapter().getInstance()); 

  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();