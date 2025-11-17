import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ImportProgressBarProps {
  current: number;
  total: number;
  status: string;
}

export const ImportProgressBar = ({ current, total, status }: ImportProgressBarProps) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-primary/5 to-accent/5 border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-foreground">{status}</p>
            <p className="text-sm font-semibold text-primary">
              {current} / {total}
            </p>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Processando em lotes... Não feche esta página.
      </p>
    </div>
  );
};
