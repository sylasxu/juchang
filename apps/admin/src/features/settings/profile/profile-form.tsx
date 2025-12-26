import { Type, type Static } from '@sinclair/typebox'
import { useFieldArray, useForm } from 'react-hook-form'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Link } from '@tanstack/react-router'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const profileFormSchema = Type.Object({
  username: Type.String({ minLength: 2, maxLength: 30 }),
  email: Type.String({ format: 'email' }),
  bio: Type.String({ minLength: 4, maxLength: 160 }),
  urls: Type.Optional(Type.Array(Type.Object({
    value: Type.String({ format: 'uri' }),
  }))),
})

type ProfileFormValues = Static<typeof profileFormSchema>

// 默认值
const defaultValues: Partial<ProfileFormValues> = {
  bio: '聚场管理员',
  urls: [],
}

export function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: typeboxResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  const { fields, append } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => showSubmittedData(data))}
        className='space-y-8'
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder='请输入用户名' {...field} />
              </FormControl>
              <FormDescription>
                这是您的公开显示名称，可以是真实姓名或昵称。每30天只能修改一次。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='选择已验证的邮箱' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='admin@juchang.app'>admin@juchang.app</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                您可以在{' '}
                <Link to='/'>邮箱设置</Link> 中管理已验证的邮箱地址。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem>
              <FormLabel>个人简介</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='简单介绍一下自己'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                您可以使用 <span>@提及</span> 来链接其他用户。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && 'sr-only')}>
                    链接
                  </FormLabel>
                  <FormDescription className={cn(index !== 0 && 'sr-only')}>
                    添加您的网站、博客或社交媒体链接。
                  </FormDescription>
                  <FormControl className={cn(index !== 0 && 'mt-1.5')}>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='mt-2'
            onClick={() => append({ value: '' })}
          >
            添加链接
          </Button>
        </div>
        <Button type='submit'>更新资料</Button>
      </form>
    </Form>
  )
}
