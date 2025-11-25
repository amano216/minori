import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export function Icon({ name, className = '', size = 20 }: IconProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return <IconComponent className={className} size={size} />;
}
