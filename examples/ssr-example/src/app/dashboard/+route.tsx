import { useQuery, useMutation, useInvalidateQueries, createQueryKeys } from 'nitro-js/data-fetching';

interface DashboardData {
  analytics: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: string;
  };
  serverHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  recentActivity: {
    id: string;
    type: 'user_signup' | 'post_created' | 'comment_added' | 'like_received';
    message: string;
    timestamp: string;
    user: string;
  }[];
  systemMetrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

interface RefreshDataVariables {
  section: 'analytics' | 'health' | 'activity' | 'metrics' | 'all';
}

// Create query keys for dashboard
const dashboardKeys = createQueryKeys('dashboard');

// Mock API function - simulates real-time dashboard data
const fetchDashboardData = async (): Promise<DashboardData> => {
  // Simulate server processing time
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    analytics: {
      pageViews: Math.floor(Math.random() * 50000) + 10000,
      uniqueVisitors: Math.floor(Math.random() * 15000) + 3000,
      bounceRate: Math.floor(Math.random() * 30) + 25,
      avgSessionDuration: `${Math.floor(Math.random() * 5) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
    },
    serverHealth: {
      status: Math.random() > 0.8 ? 'warning' : 'healthy',
      uptime: Math.floor(Math.random() * 2592000) + 86400, // 1-30 days in seconds
      cpuUsage: Math.floor(Math.random() * 60) + 20,
      memoryUsage: Math.floor(Math.random() * 40) + 30,
      diskUsage: Math.floor(Math.random() * 30) + 45
    },
    recentActivity: [
      {
        id: '1',
        type: 'user_signup',
        message: 'New user registered: alice@example.com',
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        user: 'Alice Johnson'
      },
      {
        id: '2',
        type: 'post_created',
        message: 'New blog post published: "Advanced SSR Patterns"',
        timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        user: 'Bob Smith'
      },
      {
        id: '3',
        type: 'comment_added',
        message: 'Comment added to "Data Fetching Patterns"',
        timestamp: new Date(Date.now() - Math.random() * 10800000).toISOString(),
        user: 'Carol Davis'
      },
      {
        id: '4',
        type: 'like_received',
        message: 'Post "SSR with Nitro.js" received 10 new likes',
        timestamp: new Date(Date.now() - Math.random() * 14400000).toISOString(),
        user: 'System'
      }
    ],
    systemMetrics: {
      requestsPerSecond: Math.floor(Math.random() * 500) + 100,
      averageResponseTime: Math.floor(Math.random() * 200) + 50,
      errorRate: Math.random() * 2,
      cacheHitRate: Math.floor(Math.random() * 20) + 75
    }
  };
};

const refreshDashboardData = async ({ section }: RefreshDataVariables): Promise<{ success: boolean; section: string }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error(`Failed to refresh ${section} data. Please try again.`);
  }
  
  return { success: true, section };
};

export default function DashboardPage() {
  const invalidateQueries = useInvalidateQueries();

  // This query will be executed on the server during SSR
  const { 
    data: dashboard, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: dashboardKeys.detail('main'),
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Enable background refetching for dashboard
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const refreshMutation = useMutation({
    mutationFn: refreshDashboardData,
    onSuccess: (data) => {
      // Invalidate dashboard data to trigger refetch
      invalidateQueries(dashboardKeys.detail('main'));
    },
    onError: (error) => {
      console.error('Failed to refresh dashboard:', error);
    },
  });

  if (isLoading) {
    return (
      <div>
        <h1>Dashboard</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '3rem',
          background: '#f0f8ff',
          borderRadius: '12px',
          border: '1px solid #0066cc'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #0066cc',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ margin: 0, fontSize: '1.1rem' }}>Loading dashboard data from server...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1>Dashboard</h1>
        <div style={{
          padding: '2rem',
          background: '#ffe6e6',
          border: '1px solid #ff4444',
          borderRadius: '12px',
          color: '#cc0000'
        }}>
          <h3>Error loading dashboard</h3>
          <p>{error?.message || 'An unknown error occurred'}</p>
          <button 
            onClick={() => refetch()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'warning': return '#ffc107';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return '👤';
      case 'post_created': return '📝';
      case 'comment_added': return '💬';
      case 'like_received': return '❤️';
      default: return '📊';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#333' }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isFetching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ccc',
                borderTop: '2px solid #0066cc',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span>Auto-updating...</span>
            </div>
          )}
          <button 
            onClick={() => refreshMutation.mutate({ section: 'all' })}
            disabled={refreshMutation.isPending}
            style={{
              padding: '0.75rem 1.5rem',
              background: refreshMutation.isPending ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: refreshMutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {refreshMutation.isPending ? 'Refreshing...' : '🔄 Refresh All'}
          </button>
        </div>
      </header>

      {refreshMutation.isError && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: '#ffe6e6',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          color: '#cc0000'
        }}>
          ❌ {refreshMutation.error?.message}
        </div>
      )}

      {refreshMutation.isSuccess && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: '#e6ffe6',
          border: '1px solid #44ff44',
          borderRadius: '8px',
          color: '#006600'
        }}>
          ✅ Dashboard data refreshed successfully!
        </div>
      )}

      {/* Analytics Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Analytics Overview</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {[
            { label: 'Page Views', value: dashboard.analytics.pageViews.toLocaleString(), icon: '📊', color: '#0066cc' },
            { label: 'Unique Visitors', value: dashboard.analytics.uniqueVisitors.toLocaleString(), icon: '👥', color: '#28a745' },
            { label: 'Bounce Rate', value: `${dashboard.analytics.bounceRate}%`, icon: '📈', color: '#ffc107' },
            { label: 'Avg Session', value: dashboard.analytics.avgSessionDuration, icon: '⏱️', color: '#dc3545' },
          ].map(metric => (
            <div 
              key={metric.label}
              style={{
                padding: '2rem',
                background: 'white',
                border: `2px solid ${metric.color}`,
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{metric.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: metric.color, marginBottom: '0.25rem' }}>
                {metric.value}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Server Health Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Server Health</h2>
        <div style={{ 
          padding: '2rem',
          background: 'white',
          border: `2px solid ${getStatusColor(dashboard.serverHealth.status)}`,
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: getStatusColor(dashboard.serverHealth.status)
            }} />
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: getStatusColor(dashboard.serverHealth.status),
              textTransform: 'capitalize'
            }}>
              {dashboard.serverHealth.status}
            </span>
            <span style={{ color: '#666' }}>
              Uptime: {formatUptime(dashboard.serverHealth.uptime)}
            </span>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '2rem' 
          }}>
            {[
              { label: 'CPU Usage', value: dashboard.serverHealth.cpuUsage, max: 100, color: '#0066cc' },
              { label: 'Memory Usage', value: dashboard.serverHealth.memoryUsage, max: 100, color: '#28a745' },
              { label: 'Disk Usage', value: dashboard.serverHealth.diskUsage, max: 100, color: '#ffc107' },
            ].map(metric => (
              <div key={metric.label}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '0.5rem' 
                }}>
                  <span style={{ fontWeight: 'bold' }}>{metric.label}</span>
                  <span style={{ color: metric.color, fontWeight: 'bold' }}>{metric.value}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${metric.value}%`,
                    height: '100%',
                    background: metric.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Metrics */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>System Metrics</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {[
            { label: 'Requests/sec', value: dashboard.systemMetrics.requestsPerSecond, suffix: '', color: '#0066cc' },
            { label: 'Avg Response Time', value: dashboard.systemMetrics.averageResponseTime, suffix: 'ms', color: '#28a745' },
            { label: 'Error Rate', value: dashboard.systemMetrics.errorRate.toFixed(2), suffix: '%', color: '#dc3545' },
            { label: 'Cache Hit Rate', value: dashboard.systemMetrics.cacheHitRate, suffix: '%', color: '#6f42c1' },
          ].map(metric => (
            <div 
              key={metric.label}
              style={{
                padding: '1.5rem',
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: metric.color, marginBottom: '0.5rem' }}>
                {metric.value}{metric.suffix}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Recent Activity</h2>
        <div style={{
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {dashboard.recentActivity.map((activity, index) => (
            <div 
              key={activity.id}
              style={{
                padding: '1.5rem',
                borderBottom: index < dashboard.recentActivity.length - 1 ? '1px solid #dee2e6' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>
                {getActivityIcon(activity.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {activity.message}
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                  {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ 
        marginTop: '3rem', 
        padding: '1.5rem', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>
          📊 This dashboard demonstrates real-time data fetching with SSR. 
          Data is fetched on the server and included in the initial HTML, 
          then automatically updates every 30 seconds on the client.
        </p>
      </div>
    </div>
  );
}