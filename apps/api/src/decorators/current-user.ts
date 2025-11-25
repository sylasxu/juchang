import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // request.user 是由 JwtStrategy 注入的
    const user = request.user;
    return data ? user?.[data] : user;
  },
);