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

import { useTransactions } from './transactions-provider'

const formSchema = Type.Object({
  userId: Type.String({ minLength: 1, description: '用户ID是必填项' }),
  activityId: Type.Optional(Type.String()),
  type: Type.Union([
    Type.Literal('payment'),
    Type.Literal('refund'),
    Type.Literal('reward'),
    Type.Literal('withdrawal'),
  ]),
  amount: Type.Number({ minimum: 0, description: '金额必须大于等于0' }),
  method: Type.Union([
    Type.Literal('wechat'),
    Type.Literal('alipay'),
    Type.Literal('balance'),
    Type.Literal('bank'),
  ]),
  status: Type.Union([
    Type.Literal('completed'),
    Type.Literal('pending'),
    Type.Literal('failed'),
    Type.Literal('cancelled'),
  ]),
  description: Type.Optional(Type.String()),
})

type TransactionForm = Static<typeof formSchema>

export function TransactionsMutateDrawer() {
  const { open, setOpen, currentRow } = useTransactions()
  const isOpen = open === 'create' || open === 'update'
  const isUpdate = open === 'update'

  const form = useForm<TransactionForm>({
    resolver: typeboxResolver(formSchema),
    defaultValues: currentRow ? {
      userId: currentRow.userId,
      activityId: currentRow.activityId || '',
      type: currentRow.type,
      amount: currentRow.amount,
      method: currentRow.method,
      status: currentRow.status,
      description: currentRow.description || '',
    } : {
      userId: '',
      activityId: '',
      type: 'payment',
      amount: 0,
      method: 'wechat',
      status: 'pending',
      description: '',
    },
  })

  const onSubmit = (data: TransactionForm) => {
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
          <SheetTitle>{isUpdate ? '编辑' : '创建'} 交易</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? '通过提供必要信息来更新交易。'
              : '通过提供必要信息来添加新交易记录。'}
            完成后点击保存。
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='transactions-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='userId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='请输入用户ID' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='activityId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>活动ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='请输入活动ID（可选）' />
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
                  <FormLabel>交易类型</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='选择交易类型'
                    items={[
                      { label: '支付', value: 'payment' },
                      { label: '退款', value: 'refund' },
                      { label: '奖励', value: 'reward' },
                      { label: '提现', value: 'withdrawal' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>金额</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type='number' 
                      step='0.01'
                      min='0'
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder='请输入金额' 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='method'
              render={({ field }) => (
                <FormItem className='relative'>
                  <FormLabel>支付方式</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='wechat' />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          微信支付
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='alipay' />
                        </FormControl>
                        <FormLabel className='font-normal'>支付宝</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='balance' />
                        </FormControl>
                        <FormLabel className='font-normal'>余额</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='bank' />
                        </FormControl>
                        <FormLabel className='font-normal'>银行卡</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
                  <FormLabel>交易状态</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='pending' />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          处理中
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='completed' />
                        </FormControl>
                        <FormLabel className='font-normal'>已完成</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='failed' />
                        </FormControl>
                        <FormLabel className='font-normal'>失败</FormLabel>
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
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder='请输入交易描述' rows={3} />
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
          <Button form='transactions-form' type='submit'>
            保存更改
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}