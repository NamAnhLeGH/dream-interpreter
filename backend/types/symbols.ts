// Shared symbol type definition
export interface Symbol {
  name: string;      // Word name of the symbol (e.g., "flying", "mountain")
  symbol: string;    // Emoji/icon representation (e.g., "✈️", "🏔️")
  meaning: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// Legacy symbol type for backward compatibility
export interface LegacySymbol {
  symbol: string;
  meaning: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// Union type for symbols (supports both new and legacy formats)
export type SymbolType = Symbol | LegacySymbol;

// Type guard to check if symbol has name field
export function hasSymbolName(s: SymbolType): s is Symbol {
  return 'name' in s;
}

// Helper to get symbol name (works with both types)
export function getSymbolName(s: SymbolType): string {
  return hasSymbolName(s) ? s.name : s.symbol;
}

