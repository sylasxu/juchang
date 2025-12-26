import { Type, type Static } from '@sinclair/typebox'
import { useForm } from 'react-hook-form'
import { typeboxResolver } from '@hookform/resolvers/typebox'
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
import { Switch } from '@/components/ui/switch'
import { useUsers } from './users-provider'

const formSchema = Type.Object({
  nickname: Type.String({ minLength: 1 }),
  phoneNumber: Type.Optional(Type.String()),
  avatarUrl: Type.Optional(Type.String()),
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('blocked'),
    Type.Literal('pending'),
    Type.Literal('unknown'),
  ]),
  membershipType: Type.Union([
    Type.Literal('free'),
    Type.Literal('pro'),
  ]),
  isRealNameVerified: Type.Boolean(),
})

type UserForm = Static<typeof formSchema>

export function UsersMutateDrawer() {
  const { open, setOpen, currentRow } = useUsers()
  const isOpen = open === 'create' || open === 'update'
  const isUpdate = open === 'update'

  const form = useForm<UserForm>({
    resolver: typeboxResolver(formSchema),
    defaultValues: currentRow ? {
      nickname: currentRow.nickname,
      phoneNumber: currentRow.phoneNumber || '',
      avatarUrl: currentRow.avatarUrl || '',
      status: currentRow.status,
      membershipType: currentRow.membershipType,
      isRealNameVerified: currentRow.isRealNameVerified,
    } : {
      nickname: '',
      phoneNumber: '',
      avatarUrl: '',
      status: 'active',
      membershipType: 'free',
      isRealNameVerified: false,
    },
  })

  const onSubmit = (data: UserForm) => {
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
          <SheetTitle>{isUpdate ? '编辑' : '创建'} 用户</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? '通过提供必要信息来更新用户。'
              : '通过提供必要信息来添加新用户。'}
            完成后点击保存。
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='users-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='nickname'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>昵称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='请输入昵称' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='请输入手机号' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='avatarUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>头像URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='请输入头像URL' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='选择状态'
                    items={[
                      { label: '正常', value: 'active' },
                      { label: '封禁', value: 'blocked' },
                      { label: '待审核', value: 'pending' },
                      { label: '未知', value: 'unknown' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='membershipType'
              render={({ field }) => (
                <FormItem className='relative'>
                  <FormLabel>会员类型</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='free' />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          免费用户
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='pro' />
                        </FormControl>
                        <FormLabel className='font-normal'>Pro用户</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='isRealNameVerified'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      实名认证
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>关闭</Button>
          </SheetClose>
          <Button form='users-form' type='submit'>
            保存更改
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}