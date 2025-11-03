import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

interface DreamInputProps {
  onSubmit: (dreamText: string) => void;
  isLoading: boolean;
  apiCallsRemaining: number;
}

export const DreamInput = ({ onSubmit, isLoading, apiCallsRemaining }: DreamInputProps) => {
  const [dreamText, setDreamText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = dreamText.trim();
    
    if (trimmedText.length < 10) {
      return;
    }
    
    if (trimmedText.length > 5000) {
      return;
    }
    
    onSubmit(trimmedText);
  };

  const charCount = dreamText.length;
  const isValid = charCount >= 10 && charCount <= 5000;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dream" className="text-lg font-medium">
          Describe Your Dream
        </Label>
        <Textarea
          id="dream"
          placeholder="Last night, I dreamed I was flying over a vast ocean. The sky was filled with stars, and I felt a deep sense of peace..."
          value={dreamText}
          onChange={(e) => setDreamText(e.target.value)}
          disabled={isLoading}
          className="min-h-[200px] resize-none text-base"
          maxLength={5000}
        />
        <div className="flex justify-between text-sm">
          <span className={charCount < 10 ? 'text-destructive' : 'text-muted-foreground'}>
            {charCount < 10 ? `${10 - charCount} more characters needed` : `${charCount} / 5000 characters`}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full dream-gradient hover:opacity-90 transition-all hover:shadow-lg text-base py-6"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Interpreting your dream...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Interpret Dream
          </span>
        )}
      </Button>

      {apiCallsRemaining <= 5 && apiCallsRemaining > 0 && (
        <p className="text-sm text-warning text-center">
          ⚠️ Only {apiCallsRemaining} interpretations remaining
        </p>
      )}
    </form>
  );
};
