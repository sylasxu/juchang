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

import { useActivities } from './activities-provider'

const formSchema = Type.Object({
  title: Type.String({ minLength: 1, description: '活动标题是必填项' }),
  description: Type.Optional(Type.String()),
  category: Type.Union([
    Type.Literal('sports'),
    Type.Literal('food'),
    Type.Literal('entertainment'),
    Type.Literal('study'),
    Type.Literal('travel'),
    Type.Literal('other'),
  ]),
  location: Type.String({ minLength: 1, description: '活动地点是必填项' }),
  startTime: Type.String(),
  endTime: Type.String(),
  maxParticipants: Type.Number({ minimum: 1, description: '最大参与人数必须大于0' }),
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('completed'),
    Type.Literal('cancelled'),
    Type.Literal('draft'),
  ]),
})

type ActivityForm = Static<typeof formSchema>

export function ActivitiesMutateDrawer() {
  const { open, setOpen, currentRow } = useActivities()
  const isOpen = open === 'create' || open === 'update'
  const isUpdate = open === 'update'

  const form = useForm<ActivityForm>({
    resolver: typeboxResolver(formSchema),
    defaultValues: currentRow ? {
      title: currentRow.title,
      description: currentRow.description || '',
      category: currentRow.category,
      location: currentRow.location,
      startTime: currentRow.startTime,
      endTime: currentRow.endTime,
      maxParticipants: currentRow.maxParticipants,
      status: currentRow.status,
    } : {
      title: '',
      description: '',
      category: 'other',
      location: '',
      startTime: '',
      endTime: '',
      maxParticipants: 10,
      status: 'draft',
    },
  })

  const onSubmit = (data: ActivityForm) => {
    // do something with the form data
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
          <SheetTitle>{isUpdate ? '编辑' : '创建'} 活动</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? '通过提供必要信息来更新活动。'
              : '通过提供必要信息来添加新活动。'}
            完成后点击保存。
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='activities-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活动标题</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='请输入活动标题' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活动描述</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder='请输入活动描述' rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活动分类</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='选择分类'
                    items={[
                      { label: '运动健身', value: 'sports' },
                      { label: '美食聚餐', value: 'food' },
                      { label: '娱乐休闲', value: 'entertainment' },
                      { label: '学习交流', value: 'study' },
                      { label: '旅游出行', value: 'travel' },
                      { label: '其他', value: 'other' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活动地点</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='请输入活动地点' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='startTime'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开始时间</FormLabel>
                    <FormControl>
                      <Input {...field} type='datetime-local' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='endTime'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>结束时间</FormLabel>
                    <FormControl>
                      <Input {...field} type='datetime-local' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='maxParticipants'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大参与人数</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type='number' 
                      min='1'
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder='请输入最大参与人数' 
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
                  <FormLabel>活动状态</FormLabel>
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
                          <RadioGroupItem value='active' />
                        </FormControl>
                        <FormLabel className='font-normal'>进行中</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='completed' />
                        </FormControl>
                        <FormLabel className='font-normal'>已完成</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='cancelled' />
                        </FormControl>
                        <FormLabel className='font-normal'>已取消</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
          <Button form='activities-form' type='submit'>
            保存更改
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}