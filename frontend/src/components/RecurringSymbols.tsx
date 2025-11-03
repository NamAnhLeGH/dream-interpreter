import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface RecurringSymbolsProps {
  symbols: Array<{ symbol: string; frequency: number }>;
}

export const RecurringSymbols = ({ symbols }: RecurringSymbolsProps) => {
  if (symbols.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2">
        <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-medium mb-1">No Recurring Symbols Yet</h3>
        <p className="text-sm text-muted-foreground">
          Interpret more dreams to discover patterns
        </p>
      </Card>
    );
  }

  const topSymbols = symbols.slice(0, 5);

  return (
    <Card className="p-6 border-accent/20 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-lg">Your Top Symbols</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {topSymbols.map((item, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-sm py-2 px-3 border-accent/30 hover:bg-accent/10 transition-colors"
          >
            <span className="capitalize">{item.symbol}</span>
            <span className="ml-2 text-accent font-semibold">×{item.frequency}</span>
          </Badge>
        ))}
      </div>
    </Card>
  );
};
