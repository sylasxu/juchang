'use client'

import { Type, type Static } from '@sinclair/typebox'
import { useForm } from 'react-hook-form'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useUpdateUser } from '../hooks/use-users'
import { type User } from '../data/schema'

// MVP 简化版表单 - 只允许编辑昵称
const formSchema = Type.Object({
  nickname: Type.Optional(Type.String({ maxLength: 50 })),
})

type UserForm = Static<typeof formSchema>

type UserActionDialogProps = {
  currentRow: User
  open: boolean
  onOpenChange: () => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const updateMutation = useUpdateUser()

  const form = useForm<UserForm>({
    resolver: typeboxResolver(formSchema),
    defaultValues: {
      nickname: currentRow.nickname || '',
    },
  })

  const onSubmit = async (values: UserForm) => {
    await updateMutation.mutateAsync({
      id: currentRow.id,
      data: values,
    })
    form.reset()
    onOpenChange()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset()
          onOpenChange()
        }
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>
            修改用户信息，点击保存完成更新。
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[60vh] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='nickname'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>昵称</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='用户昵称'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              
              {/* 只读信息展示 */}
              <div className='grid grid-cols-6 items-center gap-x-4 gap-y-1'>
                <span className='col-span-2 text-end text-sm text-muted-foreground'>手机号</span>
                <span className='col-span-4 text-sm'>
                  {currentRow.phoneNumber || '未绑定'}
                </span>
              </div>
              
              <div className='grid grid-cols-6 items-center gap-x-4 gap-y-1'>
                <span className='col-span-2 text-end text-sm text-muted-foreground'>AI 额度</span>
                <span className='col-span-4 text-sm'>
                  {currentRow.aiCreateQuotaToday}/3 次/天
                </span>
              </div>
              
              <div className='grid grid-cols-6 items-center gap-x-4 gap-y-1'>
                <span className='col-span-2 text-end text-sm text-muted-foreground'>发布活动</span>
                <span className='col-span-4 text-sm'>
                  {currentRow.activitiesCreatedCount} 个
                </span>
              </div>
              
              <div className='grid grid-cols-6 items-center gap-x-4 gap-y-1'>
                <span className='col-span-2 text-end text-sm text-muted-foreground'>参与活动</span>
                <span className='col-span-4 text-sm'>
                  {currentRow.participationCount} 个
                </span>
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onOpenChange} disabled={updateMutation.isPending}>
            取消
          </Button>
          <Button type='submit' form='user-form' disabled={updateMutation.isPending}>
            {updateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
