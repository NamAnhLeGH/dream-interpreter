import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { admin } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, Moon, TrendingUp, BarChart3, Sparkles, Activity } from 'lucide-react';

interface AdminAnalytics {
  total_users: number;
  total_dreams: number;
  most_common_symbols: Array<{ symbol: string; total_frequency: number }>;
  sentiment_distribution: Array<{ sentiment: string; count: number }>;
}

interface AdminUser {
  id: number;
  email: string;
  role: string;
  api_calls_used: number;
  total_dreams: number;
  created_at: string;
}

interface EndpointStat {
  method: string;
  endpoint: string;
  requests: number;
}

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [endpointStats, setEndpointStats] = useState<EndpointStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
      return;
    }

    loadAdminData();
  }, [user, navigate]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, usersData, endpointStatsData] = await Promise.all([
        admin.getAnalytics(),
        admin.getUsers(),
        admin.getEndpointStats(),
      ]);

      setAnalytics(analyticsData);
      setUsers(usersData.users);
      setEndpointStats(endpointStatsData.endpoint_stats || []);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm bg-background/95 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Platform Analytics & Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="border-primary/30"
              >
                User View
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Platform Stats */}
            {analytics && (
              <>
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <Card className="p-6 border-primary/20 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                    <p className="text-3xl font-bold text-primary">{analytics.total_users}</p>
                  </Card>

                  <Card className="p-6 border-accent/20 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Moon className="h-5 w-5 text-accent" />
                      <p className="text-sm text-muted-foreground">Total Dreams</p>
                    </div>
                    <p className="text-3xl font-bold text-accent">{analytics.total_dreams}</p>
                  </Card>

                  <Card className="p-6 border-success/20 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <p className="text-sm text-muted-foreground">Avg Dreams/User</p>
                    </div>
                    <p className="text-3xl font-bold text-success">
                      {analytics.total_users > 0
                        ? (analytics.total_dreams / analytics.total_users).toFixed(1)
                        : 0}
                    </p>
                  </Card>

                  <Card className="p-6 border-primary-glow/20 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="h-5 w-5 text-primary-glow" />
                      <p className="text-sm text-muted-foreground">Sentiment Ratio</p>
                    </div>
                    <div className="flex gap-2">
                      {analytics.sentiment_distribution.map((item) => (
                        <Badge
                          key={item.sentiment}
                          className={
                            item.sentiment === 'POSITIVE'
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          }
                        >
                          {item.count}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Symbol Analytics */}
                <Card className="p-6 mb-8 border-accent/20 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="h-6 w-6 text-accent" />
                    <h2 className="text-xl font-bold">Most Common Symbols</h2>
                  </div>
                  {analytics.most_common_symbols.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {analytics.most_common_symbols.slice(0, 15).map((item, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-base py-2 px-4 border-accent/30 hover:bg-accent/10 transition-colors"
                        >
                          <span className="capitalize">{item.symbol}</span>
                          <span className="ml-2 text-accent font-bold">×{item.total_frequency}</span>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No symbol data available yet.</p>
                  )}
                </Card>
              </>
            )}

            {/* Endpoint Statistics */}
            <Card className="p-6 mb-8 border-primary/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">API Endpoint Statistics</h2>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead className="text-center">Requests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpointStats.length > 0 ? (
                      endpointStats.map((stat, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                stat.method === 'POST'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                  : stat.method === 'GET'
                                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                  : stat.method === 'PUT' || stat.method === 'PATCH'
                                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                  : 'bg-red-500/10 text-red-500 border-red-500/20'
                              }
                            >
                              {stat.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{stat.endpoint}</TableCell>
                          <TableCell className="text-center font-semibold">{stat.requests}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No endpoint statistics available yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* User Management */}
            <Card className="p-6 border-primary/20 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">User Management</h2>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-center">API Calls</TableHead>
                      <TableHead className="text-center">Dreams</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === 'admin'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={user.api_calls_used >= 20 ? 'text-destructive font-semibold' : ''}>
                            {user.api_calls_used} / 20
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{user.total_dreams}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
