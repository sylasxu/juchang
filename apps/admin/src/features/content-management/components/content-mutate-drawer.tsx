import { Type, type Static } from '@sinclair/typebox'
import { useForm } from 'react-hook-form'
import { typeboxResolver } from '@/lib/typebox-resolver'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'

import { useContent } from './content-provider'

const formSchema = Type.Object({
  title: Type.String({ minLength: 1, description: '标题是必填项' }),
  type: Type.Union([
    Type.Literal('privacy'),
    Type.Literal('terms'),
    Type.Literal('help'),
    Type.Literal('announcement'),
    Type.Literal('h5'),
  ]),
  content: Type.Optional(Type.String()),
  url: Type.Optional(Type.String()),
  order: Type.Number({ minimum: 0, description: '排序必须大于等于0' }),
  status: Type.Union([
    Type.Literal('published'),
    Type.Literal('draft'),
    Type.Literal('archived'),
    Type.Literal('pending'),
  ]),
})

type ContentForm = Static<typeof formSchema>

export function ContentMutateDrawer() {
  const { open, setOpen, currentRow } = useContent()
  const isOpen = open === 'create' || open === 'update'
  const isUpdate = open === 'update'

  const form = useForm<ContentForm>({
    resolver: typeboxResolver(formSchema),
    defaultValues: currentRow ? {
      title: currentRow.title,
      type: currentRow.type,
      content: currentRow.content || '',
      url: currentRow.url || '',
      order: currentRow.order,
      status: currentRow.status,
    } : {
      title: '',
      type: 'help',
      content: '',
      url: '',
      order: 1,
      status: 'draft',
    },
  })

  const onSubmit = (data: ContentForm) => {
    setOpen(null)
    form.reset()
    showSubmittedData(data)
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(v) => {
        setOpen(v ? 'create' : null)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>{isUpdate ? '编辑' : '创建'} 内容</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? '通过提供必要信息来更新内容。'
              : '通过提供必要信息来添加新内容。'}
            完成后点击保存。
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='content-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='请输入内容标题' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>内容类型</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='选择内容类型'
                    items={[
                      { label: '隐私协议', value: 'privacy' },
                      { label: '用户协议', value: 'terms' },
                      { label: '帮助文档', value: 'help' },
                      { label: '系统公告', value: 'announcement' },
                      { label: 'H5页面', value: 'h5' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>访问路径</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='例如: /h5/privacy-policy' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='order'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>排序</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type='number' 
                      min='0'
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder='排序数字，越小越靠前' 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem className='relative'>
                  <FormLabel>状态</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='draft' />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          草稿
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='pending' />
                        </FormControl>
                        <FormLabel className='font-normal'>待审核</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='published' />
                        </FormControl>
                        <FormLabel className='font-normal'>已发布</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='archived' />
                        </FormControl>
                        <FormLabel className='font-normal'>已归档</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='content'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>内容</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder='请输入内容正文' rows={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>关闭</Button>
          </SheetClose>
          <Button form='content-form' type='submit'>
            保存更改
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}