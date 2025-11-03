import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecurringSymbolsProps {
  symbols: Array<{ symbol: string; frequency: number }>;
  selectedSymbol: string | null;
  onSymbolClick: (symbol: string | null) => void;
}

export const RecurringSymbols = ({ symbols, selectedSymbol, onSymbolClick }: RecurringSymbolsProps) => {
  if (symbols.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2">
        <h3 className="font-medium mb-1">No Recurring Symbols Yet</h3>
        <p className="text-sm text-muted-foreground">
          Interpret more dreams to discover patterns
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-accent/20 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Filter Dreams by Symbol</h3>
          {selectedSymbol && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSymbolClick(null)}
              className="h-6 px-2 ml-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {symbols.map((item) => {
          const isSelected = selectedSymbol === item.symbol;
          return (
            <Badge
              key={item.symbol}
              variant={isSelected ? "default" : "outline"}
              className={`text-sm py-2 px-3 cursor-pointer transition-all ${
                isSelected
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-accent/30 hover:bg-accent/10 hover:border-accent/50"
              }`}
              onClick={() => onSymbolClick(isSelected ? null : item.symbol)}
            >
              <span className="capitalize">{item.symbol}</span>
              <span className={`ml-2 font-semibold ${isSelected ? 'text-accent-foreground' : 'text-accent'}`}>
                ×{item.frequency}
              </span>
            </Badge>
          );
        })}
      </div>

      {selectedSymbol && (
        <p className="text-xs text-muted-foreground mt-3">
          Showing dreams containing: <span className="font-semibold text-accent capitalize">{selectedSymbol}</span>
        </p>
      )}
    </Card>
  );
};
