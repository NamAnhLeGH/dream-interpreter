import { Dream } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { RecurringSymbols } from './RecurringSymbols';

interface DreamJournalProps {
  dreams: Dream[];
  filterBySymbol?: string | null;
  onSymbolClick?: (symbol: string | null) => void;
  recurringSymbols?: Array<{ symbol: string; frequency: number }>;
}

export const DreamJournal = ({ dreams, filterBySymbol, onSymbolClick, recurringSymbols = [] }: DreamJournalProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filter dreams by selected symbol
  const filteredDreams = filterBySymbol
    ? dreams.filter(dream =>
        dream.symbols?.some((s: any) => {
          const symbolName = s.name || s.symbol;
          return symbolName.toLowerCase() === filterBySymbol.toLowerCase();
        })
      )
    : dreams;

  return (
    <div className="border-t-2 border-border/50 pt-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">
        Dream Journal
      </h2>

      {/* Filter Section */}
      {recurringSymbols.length > 0 && onSymbolClick && (
        <div className="mb-6">
          <RecurringSymbols 
            symbols={recurringSymbols}
            selectedSymbol={filterBySymbol}
            onSymbolClick={onSymbolClick}
          />
        </div>
      )}

      {/* Dreams List */}
      {dreams.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <h3 className="text-lg font-medium mb-2">No Dreams Yet</h3>
          <p className="text-muted-foreground">
            Your dream interpretations will appear here
          </p>
        </Card>
      ) : filterBySymbol && filteredDreams.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <h3 className="text-lg font-medium mb-2">No Dreams Found</h3>
          <p className="text-muted-foreground">
            No dreams contain the symbol "{filterBySymbol}"
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
        {filteredDreams.map((dream) => {
          const isExpanded = expandedId === dream.id;
          const preview = dream.dream_text.substring(0, 150);
          const needsExpansion = dream.dream_text.length > 150;

          return (
            <Card
              key={dream.id}
              className="p-4 hover:shadow-lg transition-all cursor-pointer border-primary/10"
              onClick={() => setExpandedId(isExpanded ? null : dream.id)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(dream.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {dream.sentiment && (
                      <Badge
                        className={
                          dream.sentiment === 'POSITIVE'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }
                      >
                        {dream.sentiment}
                      </Badge>
                    )}
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {isExpanded ? dream.dream_text : preview}
                    {!isExpanded && needsExpansion && '...'}
                  </p>
                  {dream.symbols && dream.symbols.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {dream.symbols.map((symbol: any, idx: number) => {
                        const emoji = symbol.symbol || '✨';
                        const name = symbol.name || symbol.symbol;
                        return (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <span className="mr-1">{emoji}</span>
                            {name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
};
