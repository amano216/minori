import * as LucideIcons from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return <IconComponent {...props} />;
}
