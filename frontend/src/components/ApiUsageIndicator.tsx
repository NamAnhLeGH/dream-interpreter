import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';

interface ApiUsageIndicatorProps {
  used: number;
  total?: number;
}

export const ApiUsageIndicator = ({ used, total = 20 }: ApiUsageIndicatorProps) => {
  const percentage = (used / total) * 100;
  
  const getColor = () => {
    if (percentage >= 100) return 'text-destructive';
    if (percentage >= 75) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <Card className="p-6 border-primary/20 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">API Usage</h3>
        </div>
        <span className={`text-2xl font-bold ${getColor()}`}>
          {used} / {total}
        </span>
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-3" />
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {total - used > 0
          ? `${total - used} interpretations remaining`
          : 'Limit reached - interpretations will still work with warning'}
      </p>
    </Card>
  );
};
