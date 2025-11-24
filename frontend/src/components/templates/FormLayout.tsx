import type { ReactNode } from 'react';
import { Button } from '../atoms/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../molecules/Card';

interface FormLayoutProps {
  title: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  className?: string;
}

export function FormLayout({
  title,
  children,
  onSubmit,
  onCancel,
  submitLabel = '保存',
  cancelLabel = 'キャンセル',
  loading = false,
  className = '',
}: FormLayoutProps) {
  return (
    <Card className={className}>
      <CardHeader>{title}</CardHeader>
      <form onSubmit={onSubmit}>
        <CardBody className="space-y-4">
          {children}
        </CardBody>
        <CardFooter>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? '処理中...' : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
