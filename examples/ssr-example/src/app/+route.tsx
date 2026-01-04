import { useState } from 'react';
import { useQuery, createQueryKeys } from 'nitro-js/query';

interface ServerStats {
  serverTime: string;
  uptime: number;
  requests: number;
  activeUsers: number;
  memoryUsage: string;
}

// Create query keys for server stats
const serverKeys = createQueryKeys('server');

// Mock API function that simulates server-side data
const fetchServerStats = async (): Promise<ServerStats> => {
  // Simulate server processing time
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    serverTime: new Date().toISOString(),
    uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
    requests: Math.floor(Math.random() * 10000) + 1000,
    activeUsers: Math.floor(Math.random() * 500) + 50,
    memoryUsage: `${(Math.random() * 512 + 256).toFixed(1)}MB`,
  };
};

export default function HomePage() {
  const [count, setCount] = useState(0);

  // This query will be executed on the server during SSR
  const { 
    data: stats, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: serverKeys.detail('stats'),
    queryFn: fetchServerStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds on client
  });

  return (
    <div>
      <h1>Welcome to Nitro.js SSR Mode!</h1>
      <p>
        This page is server-side rendered with data fetching. 
        The server stats below were fetched on the server and sent with the initial HTML.
      </p>
      
      <div style={{ margin: '2rem 0' }}>
        <h2>Interactive Counter (Client-side)</h2>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Count: {count}
        </button>
        <small style={{ color: '#666' }}>
          This counter is hydrated on the client and maintains state during navigation.
        </small>
      </div>

      <div style={{ margin: '2rem 0' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem' 
        }}>
          <h2>Server Statistics (SSR + Hydration)</h2>
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
                <span>Updating...</span>
              </div>
            )}
            <button 
              onClick={() => refetch()}
              disabled={isFetching}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.9rem',
                background: isFetching ? '#ccc' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isFetching ? 'not-allowed' : 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '2rem',
            background: '#f0f8ff',
            borderRadius: '8px',
            border: '1px solid #0066cc'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #0066cc',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ margin: 0 }}>Loading server statistics...</p>
          </div>
        ) : isError ? (
          <div style={{
            padding: '1rem',
            background: '#ffe6e6',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            color: '#cc0000'
          }}>
            <p>Error loading server stats: {error?.message}</p>
          </div>
        ) : stats ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            {[
              { label: 'Server Time', value: new Date(stats.serverTime).toLocaleString(), icon: '🕐', color: '#0066cc' },
              { label: 'Uptime', value: `${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m`, icon: '⏱️', color: '#28a745' },
              { label: 'Requests', value: stats.requests.toLocaleString(), icon: '📊', color: '#ffc107' },
              { label: 'Active Users', value: stats.activeUsers.toLocaleString(), icon: '👥', color: '#dc3545' },
              { label: 'Memory Usage', value: stats.memoryUsage, icon: '💾', color: '#6f42c1' },
            ].map(stat => (
              <div 
                key={stat.label}
                style={{
                  padding: '1.5rem',
                  background: 'white',
                  border: `2px solid ${stat.color}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color, marginBottom: '0.25rem' }}>
                  {stat.value}
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ margin: '2rem 0' }}>
        <h2>SSR Benefits</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#e8f5e8', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>🚀 Fast Initial Load</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Server renders HTML with data, so users see content immediately without waiting for JavaScript.
            </p>
          </div>
          <div style={{ padding: '1rem', background: '#e8f5e8', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>🔍 SEO Friendly</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Search engines can crawl the fully rendered HTML with all content and metadata.
            </p>
          </div>
          <div style={{ padding: '1rem', background: '#e8f5e8', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>♿ Better Accessibility</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Screen readers and other assistive technologies can access content immediately.
            </p>
          </div>
          <div style={{ padding: '1rem', background: '#e8f5e8', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>📱 Progressive Enhancement</h3>
            <p style={{ margin: 0, color: '#666' }}>
              Basic functionality works even if JavaScript fails to load or is disabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}