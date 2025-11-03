import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dreams, DreamInterpretation, Dream, DreamStats } from '@/lib/api';
import { DreamInput } from '@/components/DreamInput';
import { DreamResult } from '@/components/DreamResult';
import { DreamJournal } from '@/components/DreamJournal';
import { RecurringSymbols } from '@/components/RecurringSymbols';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut, Moon, User, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<DreamInterpretation | null>(null);
  const [dreamHistory, setDreamHistory] = useState<Dream[]>([]);
  const [stats, setStats] = useState<DreamStats | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      const [historyData, statsData] = await Promise.all([
        dreams.getHistory(),
        dreams.getStats(),
      ]);

      setDreamHistory(historyData.dreams);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data');
    }
  };

  const handleInterpretDream = async (dreamText: string) => {
    setIsLoading(true);
    setCurrentResult(null);

    try {
      const result = await dreams.interpret(dreamText);
      setCurrentResult(result);
      
      // Reload data to update stats and history
      await loadDashboardData();

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      toast.success('Dream interpreted successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to interpret dream');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm bg-background/95 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg dream-gradient">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Dream Interpreter
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="border-primary/30"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* User Info & Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>
          </Card>

          {stats && (
            <Card className="p-6 border-primary/20">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary mb-1">{stats.total_dreams}</p>
                <p className="text-sm text-muted-foreground">Dreams Interpreted</p>
              </div>
            </Card>
          )}
        </div>

        {/* Dream Input */}
        <div className="mb-8">
          <DreamInput
            onSubmit={handleInterpretDream}
            isLoading={isLoading}
            apiCallsRemaining={stats?.api_calls_remaining || 20}
          />
        </div>

        {/* Results */}
        {currentResult && (
          <div id="results" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Dream Interpretation</h2>
            <DreamResult result={currentResult} />
          </div>
        )}

        {/* Recurring Symbols */}
        {stats && stats.recurring_symbols.length > 0 && (
          <div className="mb-8">
            <RecurringSymbols symbols={stats.recurring_symbols} />
          </div>
        )}

        {/* Dream Journal */}
        {dreamHistory.length > 0 && (
          <div className="mb-8">
            <DreamJournal dreams={dreamHistory} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
