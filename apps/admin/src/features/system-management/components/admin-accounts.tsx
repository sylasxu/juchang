import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  UserCog, 
  Plus,
  Edit,
  MoreHorizontal,
  Shield,
  Eye,
  Key,
  Trash2,
  Crown,
  Settings,
  Users
} from 'lucide-react'
import { Role, Permission, rolePermissions } from '@/lib/permissions'
import { PermissionGuard, PermissionButton } from '@/components/auth/permission-guard'

interface AdminAccount {
  id: string
  username: string
  email: string
  nickname: string
  role: Role
  permissions: Permission[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
  createdBy: string
}

interface AdminFormData {
  username: string
  email: string
  nickname: string
  role: Role
  permissions: Permission[]
  isActive: boolean
}

export function AdminAccounts() {
  const [admins, setAdmins] = useState<AdminAccount[]>([
    {
      id: '1',
      username: 'superadmin',
      email: 'super@juchang.com',
      nickname: '超级管理员',
      role: Role.SUPER_ADMIN,
      permissions: [Permission.ADMIN_FULL],
      isActive: true,
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'system',
    },
    {
      id: '2',
      username: 'admin001',
      email: 'admin001@juchang.com',
      nickname: '系统管理员',
      role: Role.ADMIN,
      permissions: rolePermissions[Role.ADMIN],
      isActive: true,
      lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'superadmin',
    },
    {
      id: '3',
      username: 'moderator001',
      email: 'mod001@juchang.com',
      nickname: '内容审核员',
      role: Role.MODERATOR,
      permissions: rolePermissions[Role.MODERATOR],
      isActive: true,
      lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'admin001',
    },
    {
      id: '4',
      username: 'analyst001',
      email: 'analyst001@juchang.com',
      nickname: '数据分析师',
      role: Role.ANALYST,
      permissions: rolePermissions[Role.ANALYST],
      isActive: false,
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'admin001',
    }
  ])

  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<AdminFormData>({
    username: '',
    email: '',
    nickname: '',
    role: Role.VIEWER,
    permissions: [],
    isActive: true,
  })

  const roleOptions = [
    { 
      value: Role.SUPER_ADMIN, 
      label: '超级管理员', 
      icon: Crown, 
      color: 'bg-purple-500',
      description: '拥有所有权限，可以管理其他管理员'
    },
    { 
      value: Role.ADMIN, 
      label: '系统管理员', 
      icon: Shield, 
      color: 'bg-blue-500',
      description: '可以管理用户、活动和系统配置'
    },
    { 
      value: Role.MODERATOR, 
      label: '内容审核员', 
      icon: Eye, 
      color: 'bg-green-500',
      description: '负责内容审核和用户管理'
    },
    { 
      value: Role.ANALYST, 
      label: '数据分析师', 
      icon: Settings, 
      color: 'bg-orange-500',
      description: '负责数据分析和报告生成'
    },
    { 
      value: Role.SUPPORT, 
      label: '客服专员', 
      icon: Users, 
      color: 'bg-teal-500',
      description: '负责用户支持和客服工作'
    },
    { 
      value: Role.VIEWER, 
      label: '只读用户', 
      icon: Eye, 
      color: 'bg-gray-500',
      description: '只能查看数据，无修改权限'
    },
  ]

  const permissionOptions = [
    // 用户管理权限
    { value: Permission.USER_VIEW, label: '查看用户', category: '用户管理' },
    { value: Permission.USER_EDIT, label: '编辑用户', category: '用户管理' },
    { value: Permission.USER_MODERATE, label: '审核用户', category: '用户管理' },
    { value: Permission.USER_DELETE, label: '删除用户', category: '用户管理' },
    
    // 活动管理权限
    { value: Permission.ACTIVITY_VIEW, label: '查看活动', category: '活动管理' },
    { value: Permission.ACTIVITY_EDIT, label: '编辑活动', category: '活动管理' },
    { value: Permission.ACTIVITY_MODERATE, label: '审核活动', category: '活动管理' },
    { value: Permission.ACTIVITY_DELETE, label: '删除活动', category: '活动管理' },
    
    // 交易管理权限
    { value: Permission.TRANSACTION_VIEW, label: '查看交易', category: '交易管理' },
    { value: Permission.TRANSACTION_EDIT, label: '编辑交易', category: '交易管理' },
    { value: Permission.TRANSACTION_REFUND, label: '处理退款', category: '交易管理' },
    
    // 内容审核权限
    { value: Permission.MODERATION_VIEW, label: '查看审核', category: '内容审核' },
    { value: Permission.MODERATION_APPROVE, label: '批准内容', category: '内容审核' },
    { value: Permission.MODERATION_REJECT, label: '拒绝内容', category: '内容审核' },
    { value: Permission.MODERATION_RULES, label: '管理规则', category: '内容审核' },
    
    // 风险管理权限
    { value: Permission.RISK_VIEW, label: '查看风险', category: '风险管理' },
    { value: Permission.RISK_ASSESS, label: '风险评估', category: '风险管理' },
    { value: Permission.RISK_INVESTIGATE, label: '风险调查', category: '风险管理' },
    { value: Permission.RISK_RESOLVE, label: '风险处理', category: '风险管理' },
    
    // 系统管理权限
    { value: Permission.SYSTEM_VIEW, label: '查看系统', category: '系统管理' },
    { value: Permission.SYSTEM_CONFIG, label: '系统配置', category: '系统管理' },
    { value: Permission.SYSTEM_MAINTENANCE, label: '系统维护', category: '系统管理' },
    { value: Permission.SYSTEM_AUDIT, label: '审计日志', category: '系统管理' },
    
    // 分析报告权限
    { value: Permission.ANALYTICS_VIEW, label: '查看分析', category: '数据分析' },
    { value: Permission.ANALYTICS_EXPORT, label: '导出报告', category: '数据分析' },
  ]

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      nickname: '',
      role: Role.VIEWER,
      permissions: [],
      isActive: true,
    })
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingAdmin(null)
    resetForm()
  }

  const handleEdit = (admin: AdminAccount) => {
    setIsCreating(false)
    setEditingAdmin(admin)
    setFormData({
      username: admin.username,
      email: admin.email,
      nickname: admin.nickname,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
    })
  }

  const handleSave = () => {
    if (isCreating) {
      const newAdmin: AdminAccount = {
        id: Date.now().toString(),
        ...formData,
        lastLogin: undefined,
        createdAt: new Date().toISOString(),
        createdBy: 'current-admin',
      }
      setAdmins([...admins, newAdmin])
    } else if (editingAdmin) {
      setAdmins(admins.map(admin => 
        admin.id === editingAdmin.id 
          ? { ...admin, ...formData }
          : admin
      ))
    }
    setIsCreating(false)
    setEditingAdmin(null)
    resetForm()
  }

  const handleToggleStatus = (id: string) => {
    setAdmins(admins.map(admin => 
      admin.id === id 
        ? { ...admin, isActive: !admin.isActive }
        : admin
    ))
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个管理员账户吗？')) {
      setAdmins(admins.filter(admin => admin.id !== id))
    }
  }

  const getRoleInfo = (role: string) => {
    return roleOptions.find(r => r.value === role) || roleOptions[3]
  }

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return '从未登录'
    const now = new Date()
    const loginTime = new Date(lastLogin)
    const diffMs = now.getTime() - loginTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}天前`
    if (diffHours > 0) return `${diffHours}小时前`
    return '刚刚'
  }

  const getPermissionsByRole = (role: Role): Permission[] => {
    return rolePermissions[role] || []
  }

  return (
    <div className="space-y-6">
      {/* 管理员统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总管理员</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
            <p className="text-xs text-muted-foreground">
              系统管理员账户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃账户</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(a => a.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              启用状态的账户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在线管理员</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(a => {
                if (!a.lastLogin) return false
                const diffMs = Date.now() - new Date(a.lastLogin).getTime()
                return diffMs < 30 * 60 * 1000 // 30分钟内
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              30分钟内活跃
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">超级管理员</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(a => a.role === Role.SUPER_ADMIN).length}
            </div>
            <p className="text-xs text-muted-foreground">
              最高权限账户
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 管理员账户管理 */}
      <PermissionGuard permission={Permission.SYSTEM_VIEW}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                管理员账户
              </CardTitle>
              <PermissionButton permission={Permission.SYSTEM_CONFIG}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={handleCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加管理员
                    </Button>
                  </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isCreating ? '添加管理员' : '编辑管理员'}
                  </DialogTitle>
                  <DialogDescription>
                    {isCreating ? '创建新的管理员账户' : '修改管理员账户信息'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      用户名
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="输入用户名"
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      邮箱
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="输入邮箱地址"
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nickname" className="text-right">
                      显示名称
                    </Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="输入显示名称"
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      角色权限
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) => {
                        setFormData({ 
                          ...formData, 
                          role: value,
                          permissions: getPermissionsByRole(value)
                        })
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <role.icon className="h-4 w-4" />
                              <div>
                                <div>{role.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {role.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">权限列表</Label>
                    <div className="col-span-3">
                      {formData.permissions.includes(Permission.ADMIN_FULL) ? (
                        <Badge variant="default" className="mb-2">
                          <Crown className="h-3 w-3 mr-1" />
                          所有权限
                        </Badge>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {permissionOptions.map((permission) => (
                            <label key={permission.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      permissions: [...formData.permissions, permission.value]
                                    })
                                  } else {
                                    setFormData({
                                      ...formData,
                                      permissions: formData.permissions.filter(p => p !== permission.value)
                                    })
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{permission.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active" className="text-right">
                      启用状态
                    </Label>
                    <Switch
                      id="active"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" onClick={handleSave}>
                    {isCreating ? '创建账户' : '保存修改'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionButton>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>管理员信息</TableHead>
                <TableHead>角色权限</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const roleInfo = getRoleInfo(admin.role)
                const RoleIcon = roleInfo.icon
                
                return (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${roleInfo.color} flex items-center justify-center`}>
                          <RoleIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{admin.nickname}</div>
                          <div className="text-sm text-muted-foreground">
                            @{admin.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {roleInfo.label}
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.includes(Permission.ADMIN_FULL) ? (
                            <Badge variant="default" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              全部权限
                            </Badge>
                          ) : (
                            admin.permissions.slice(0, 3).map((permission) => {
                              const permInfo = permissionOptions.find(p => p.value === permission)
                              return (
                                <Badge key={permission} variant="secondary" className="text-xs">
                                  {permInfo?.label || permission}
                                </Badge>
                              )
                            })
                          )}
                          {admin.permissions.length > 3 && !admin.permissions.includes(Permission.ADMIN_FULL) && (
                            <Badge variant="secondary" className="text-xs">
                              +{admin.permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={admin.isActive}
                          onCheckedChange={() => handleToggleStatus(admin.id)}
                        />
                        <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                          {admin.isActive ? '启用' : '禁用'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatLastLogin(admin.lastLogin)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PermissionButton permission={Permission.SYSTEM_CONFIG}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(admin)}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="h-4 w-4 mr-2" />
                              重置密码
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(admin.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </PermissionButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </PermissionGuard>
    </div>
  )
}