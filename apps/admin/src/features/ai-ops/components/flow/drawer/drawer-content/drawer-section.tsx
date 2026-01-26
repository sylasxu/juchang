/**
 * Drawer Section Components
 * 
 * Drawer 内容的基础组件
 */

import { memo } from 'react';

interface DrawerSectionProps {
  title: string;
  children: React.ReactNode;
}

export const DrawerSection = memo(({ title, children }: DrawerSectionProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
});

DrawerSection.displayName = 'DrawerSection';

interface DrawerFieldProps {
  label: string;
  value: React.ReactNode;
}

export const DrawerField = memo(({ label, value }: DrawerFieldProps) => {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
});

DrawerField.displayName = 'DrawerField';

interface DrawerCodeProps {
  code: unknown;
}

export const DrawerCode = memo(({ code }: DrawerCodeProps) => {
  return (
    <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">
      <code>{JSON.stringify(code, null, 2)}</code>
    </pre>
  );
});

DrawerCode.displayName = 'DrawerCode';
