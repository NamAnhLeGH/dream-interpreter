import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sparkles, Star } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dream-bg relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 text-primary/20 animate-float">
        <Moon size={64} />
      </div>
      <div className="absolute bottom-20 right-20 text-accent/20 animate-float" style={{ animationDelay: '1s' }}>
        <Sparkles size={56} />
      </div>
      <div className="absolute top-40 right-40 text-primary-glow/20 animate-float" style={{ animationDelay: '2s' }}>
        <Star size={48} />
      </div>
      <div className="absolute bottom-40 left-40 text-accent/15 animate-float" style={{ animationDelay: '1.5s' }}>
        <Sparkles size={40} />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex p-4 rounded-full dream-gradient mb-4 glow-effect animate-float">
          <Moon className="h-16 w-16 text-white" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent leading-tight">
          Dream Interpreter
        </h1>

        <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
          Unlock the mysteries of your subconscious with AI-powered dream analysis.
          Discover hidden meanings, patterns, and insights from your dreams.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button
            size="lg"
            onClick={() => navigate('/register')}
            className="dream-gradient hover:opacity-90 transition-all text-lg px-8 py-6 glow-effect"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Start Your Journey
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/login')}
            className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/5"
          >
            Sign In
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-12">
          <div className="p-6 rounded-xl backdrop-blur-sm bg-card/50 border border-primary/20 hover:border-primary/40 transition-all">
            <div className="text-4xl mb-3">🌙</div>
            <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI interprets your dreams with psychological insights
            </p>
          </div>

          <div className="p-6 rounded-xl backdrop-blur-sm bg-card/50 border border-accent/20 hover:border-accent/40 transition-all">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="font-semibold text-lg mb-2">Symbol Detection</h3>
            <p className="text-sm text-muted-foreground">
              Automatically identify and understand recurring symbols
            </p>
          </div>

          <div className="p-6 rounded-xl backdrop-blur-sm bg-card/50 border border-primary-glow/20 hover:border-primary-glow/40 transition-all">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="font-semibold text-lg mb-2">Dream Journal</h3>
            <p className="text-sm text-muted-foreground">
              Track patterns and insights across all your dreams
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
