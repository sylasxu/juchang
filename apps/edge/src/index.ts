import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { UserService } from '@juchang/services'

const app = new Hono()
const userService = new UserService()

app.get('/', (c) => {
  return c.json({ message: 'Hono API Running' })
})

// 测试用户服务
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const user = await userService.findById(id)
    if (user) {
      return c.json({ user })
    } else {
      return c.json({ message: 'User not found' }, 404)
    }
  } catch (error) {
    return c.json({ message: 'Error fetching user', error: (error as Error).message }, 500)
  }
})

serve({ fetch: app.fetch, port: 3000 })
console.log('API running on port 3000')