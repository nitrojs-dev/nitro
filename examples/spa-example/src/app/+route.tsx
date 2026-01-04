import { useState } from 'react';
import { useQuerySignal, useMutation, useInvalidateQueries } from 'nitro-js/query';

interface Stats {
  users: number;
  posts: number;
  comments: number;
  likes: number;
}

interface UpdateStatsVariables {
  increment: number;
}

// Mock API functions
const fetchStats = async (): Promise<Stats> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    users: Math.floor(Math.random() * 10000) + 1000,
    posts: Math.floor(Math.random() * 500) + 100,
    comments: Math.floor(Math.random() * 2000) + 500,
    likes: Math.floor(Math.random() * 5000) + 1000,
  };
};

const updateStats = async ({ increment }: UpdateStatsVariables): Promise<Stats> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    users: Math.floor(Math.random() * 10000) + 1000 + increment,
    posts: Math.floor(Math.random() * 500) + 100 + increment,
    comments: Math.floor(Math.random() * 2000) + 500 + increment,
    likes: Math.floor(Math.random() * 5000) + 1000 + increment,
  };
};

export default function HomePage() {
  const [count, setCount] = useState(0);
  const invalidateQueries = useInvalidateQueries();

  // Using signal-based query for reactive stats
  const [statsSignal, { isLoading, isError, error, refetch, isFetching }] = useQuerySignal(
    ['stats'],
    fetchStats,
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 10 * 1000, // Refetch every 10 seconds
    }
  );

  const updateStatsMutation = useMutation({
    mutationFn: updateStats,
    onSuccess: () => {
      // Invalidate stats to trigger refetch
      invalidateQueries(['stats']);
    },
  });

  // Get current stats from signal
  const stats = statsSignal();

  return (
    <div>
      <h1>Welcome to Nitro.js SPA Mode!</h1>
      <p>This is a single-page application built with Nitro.js running in SPA mode with advanced data fetching.</p>
      
      <div style={{ margin: '2rem 0' }}>
        <h2>Interactive Counter</h2>
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
        <button 
          onClick={() => updateStatsMutation.mutate({ increment: count })}
          disabled={updateStatsMutation.isPending}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            background: updateStatsMutation.isPending ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: updateStatsMutation.isPending ? 'not-allowed' : 'pointer'
          }}
        >
          {updateStatsMutation.isPending ? 'Updating...' : 'Update Stats'}
        </button>
      </div>

      <div style={{ margin: '2rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Live Statistics (Signal-based)</h2>
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
            <p style={{ margin: 0 }}>Loading live statistics...</p>
          </div>
        ) : isError ? (
          <div style={{
            padding: '1rem',
            background: '#ffe6e6',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            color: '#cc0000'
          }}>
            <p>Error loading stats: {error?.message}</p>
          </div>
        ) : stats ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            {[
              { label: 'Users', value: stats.users, icon: '👥', color: '#0066cc' },
              { label: 'Posts', value: stats.posts, icon: '📝', color: '#28a745' },
              { label: 'Comments', value: stats.comments, icon: '💬', color: '#ffc107' },
              { label: 'Likes', value: stats.likes, icon: '❤️', color: '#dc3545' },
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color, marginBottom: '0.25rem' }}>
                  {stat.value.toLocaleString()}
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {updateStatsMutation.isError && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#ffe6e6',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            color: '#cc0000'
          }}>
            Failed to update stats: {updateStatsMutation.error?.message}
          </div>
        )}
      </div>

      <div>
        <h2>Framework Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0066cc' }}>🚀 Data Fetching</h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>TanStack Query-like API</li>
              <li>Automatic caching with LRU</li>
              <li>Background refetching</li>
              <li>Optimistic updates</li>
              <li>Request deduplication</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#28a745' }}>⚡ Signals</h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Reactive state management</li>
              <li>Signal-based queries</li>
              <li>Automatic UI updates</li>
              <li>Fine-grained reactivity</li>
              <li>Zero boilerplate</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ffc107' }}>🛣️ Routing</h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>File-based routing</li>
              <li>Client-side navigation</li>
              <li>Dynamic routes</li>
              <li>Nested layouts</li>
              <li>View transitions</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#dc3545' }}>🔧 Developer Experience</h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>TypeScript support</li>
              <li>Hot module replacement</li>
              <li>Vite integration</li>
              <li>Zero configuration</li>
              <li>Modern tooling</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}