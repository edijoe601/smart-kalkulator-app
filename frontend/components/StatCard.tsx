import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBg: string;
  actions?: ReactNode;
}

export default function StatCard({ title, value, subtitle, icon, iconBg, actions }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
        </div>
        {actions && (
          <div className="mt-4 space-y-2">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
