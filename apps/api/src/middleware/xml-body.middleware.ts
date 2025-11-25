import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
// @ts-ignore: body-parser-xml 没有官方类型定义，忽略类型检查
import * as bodyParserXml from 'body-parser-xml';

@Injectable()
export class XmlBodyMiddleware implements NestMiddleware {
  private readonly xmlParser: any;

  constructor() {
    // 1. 将 XML 解析能力注入到 body-parser 实例中
    bodyParserXml(bodyParser);

    // 2. 创建 XML 解析器中间件
    // 这里的配置对应微信支付回调的 XML 格式
    this.xmlParser = (bodyParser as any).xml({
      limit: '1MB', // 限制包大小，防止 DOS
      xmlParseOptions: {
        explicitArray: false, // 关键：不要把单个节点转成数组
        normalize: true,      // 消除空白
        normalizeTags: true,  // 标签转小写 (微信返回的可能是 AppId 或 appid)
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // 调用生成的 express 中间件
    this.xmlParser(req, res, next);
  }
}