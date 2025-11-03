import { DreamInterpretation } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles, AlertCircle, Lightbulb, FileText } from 'lucide-react';

interface DreamResultProps {
  result: DreamInterpretation;
}

export const DreamResult = ({ result }: DreamResultProps) => {
  const sentimentColor = result.emotional_tone.sentiment === 'POSITIVE' 
    ? 'bg-success/10 text-success border-success/20' 
    : 'bg-destructive/10 text-destructive border-destructive/20';

  return (
    <div className="space-y-6 animate-fade-in">
      {result.warning && (
        <Card className="p-4 border-warning/50 bg-warning/5">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">{result.warning}</p>
          </div>
        </Card>
      )}

      {/* Emotional Tone */}
      <Card className="p-6 space-y-3 border-primary/20 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Emotional Tone</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className={sentimentColor}>
                {result.emotional_tone.sentiment}
              </Badge>
              <Badge variant="outline">
                {result.emotional_tone.confidence} confidence
              </Badge>
            </div>
            <p className="text-muted-foreground">{result.emotional_tone.description}</p>
          </div>
        </div>
      </Card>

      {/* Symbols */}
      {result.symbols_detected.length > 0 ? (
        <Card className="p-6 space-y-3 border-accent/20 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-semibold text-lg">Dream Symbols</h3>
          </div>
          <div className="grid gap-3">
            {result.symbols_detected.map((symbol, index) => {
              const symbolColor = 
                symbol.sentiment === 'positive' ? 'border-success/30 bg-success/5' :
                symbol.sentiment === 'negative' ? 'border-destructive/30 bg-destructive/5' :
                'border-muted bg-muted/5';

              return (
                <div key={index} className={`p-4 rounded-lg border ${symbolColor} transition-all hover:shadow-md`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getSymbolEmoji(symbol.symbol)}</span>
                    <div>
                      <h4 className="font-medium capitalize mb-1">{symbol.symbol}</h4>
                      <p className="text-sm text-muted-foreground">{symbol.meaning}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-6 border-muted">
          <p className="text-muted-foreground text-center">No specific symbols detected in this dream.</p>
        </Card>
      )}

      {/* AI Interpretation */}
      <Card className="p-6 space-y-3 border-primary/20 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">AI Interpretation</h3>
        </div>
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{result.ai_interpretation}</p>
      </Card>

      {/* Personalized Advice */}
      <Card className="p-6 space-y-3 border-primary-glow/20 shadow-lg glow-effect">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg dream-gradient">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-lg">Personalized Advice</h3>
        </div>
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{result.personalized_advice}</p>
      </Card>

      {/* Summary */}
      <Card className="p-6 bg-muted/50 border-muted">
        <h3 className="font-semibold mb-2">Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis_summary}</p>
      </Card>
    </div>
  );
};

function getSymbolEmoji(symbol: string): string {
  const emojiMap: Record<string, string> = {
    water: '💧',
    ocean: '🌊',
    flying: '🦅',
    falling: '🪂',
    death: '💀',
    birth: '👶',
    snake: '🐍',
    dog: '🐕',
    cat: '🐱',
    bird: '🦜',
    tree: '🌳',
    house: '🏠',
    car: '🚗',
    fire: '🔥',
    sun: '☀️',
    moon: '🌙',
    stars: '⭐',
    mountain: '⛰️',
    flower: '🌸',
    door: '🚪',
  };

  return emojiMap[symbol.toLowerCase()] || '✨';
}
