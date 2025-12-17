import React from 'react'
import { usePermissions, type Permission, type PermissionGuardProps } from '@/lib/permissions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldX } from 'lucide-react'

/**
 * 权限守卫组件
 * 根据用户权限控制内容显示
 */
export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  // 检查权限
  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    // 如果没有指定权限，默认允许访问
    hasAccess = true
  }

  if (!hasAccess) {
    if (fallback !== undefined) {
      return <>{fallback}</>
    }

    // 默认的无权限提示
    return (
      <Alert variant="destructive" className="m-4">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          您没有访问此功能的权限。请联系管理员获取相应权限。
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}

/**
 * 权限检查 Hook 组件
 * 用于在组件内部进行权限检查
 */
export function usePermissionGuard() {
  const permissions = usePermissions()

  const checkAccess = (
    permission?: Permission,
    permissionList?: Permission[],
    requireAll = false
  ): boolean => {
    if (permission) {
      return permissions.hasPermission(permission)
    }
    
    if (permissionList && permissionList.length > 0) {
      return requireAll 
        ? permissions.hasAllPermissions(permissionList)
        : permissions.hasAnyPermission(permissionList)
    }
    
    return true
  }

  return {
    ...permissions,
    checkAccess,
  }
}

/**
 * 权限按钮组件
 * 根据权限控制按钮的显示和禁用状态
 */
interface PermissionButtonProps extends PermissionGuardProps {
  children: React.ReactElement
  disableInsteadOfHide?: boolean
}

export function PermissionButton({
  permission,
  permissions,
  requireAll = false,
  disableInsteadOfHide = false,
  children,
}: PermissionButtonProps) {
  const { checkAccess } = usePermissionGuard()
  
  const hasAccess = checkAccess(permission, permissions, requireAll)

  if (!hasAccess) {
    if (disableInsteadOfHide) {
      return React.cloneElement(children, {
        disabled: true,
        title: '您没有执行此操作的权限',
      })
    }
    return null
  }

  return children
}

/**
 * 权限菜单项组件
 * 根据权限控制菜单项的显示
 */
interface PermissionMenuItemProps extends PermissionGuardProps {
  children: React.ReactElement
}

export function PermissionMenuItem({
  permission,
  permissions,
  requireAll = false,
  children,
}: PermissionMenuItemProps) {
  const { checkAccess } = usePermissionGuard()
  
  const hasAccess = checkAccess(permission, permissions, requireAll)

  if (!hasAccess) {
    return null
  }

  return children
}