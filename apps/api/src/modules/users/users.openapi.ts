import { OpenAPIHono } from '@hono/zod-openapi';
import { userService } from '@juchang/services';
import { listRoute, createRoute, getByIdRoute, updateRoute } from './users.routes';

const users = new OpenAPIHono();

// 1. List
users.openapi(listRoute, async (c) => {
  // query 自动推断为 { page: number, limit: number }
  const query = c.req.valid('query'); 
  const result = await userService.list(query);
  return c.json(result);
});

// 2. Create
users.openapi(createRoute, async (c) => {
  const body = c.req.valid('json');
  const user = await userService.create(body);
  return c.json(user);
});

// 3. Get
users.openapi(getByIdRoute, async (c) => {
  const { id } = c.req.valid('param');
  const user = await userService.getById(id);
  if (!user) return c.json({ code: 404, message: 'Not found' }, 404);
  return c.json(user);
});

// 4. Update
users.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const updated = await userService.update(id, body);
  return c.json(updated);
});

export default users;