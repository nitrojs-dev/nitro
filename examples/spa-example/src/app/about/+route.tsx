import { useQuery, usePrefetchQuery, useSetQueryData } from 'nitro-js/query';

interface FrameworkInfo {
  name: string;
  version: string;
  features: string[];
  performance: {
    bundleSize: string;
    buildTime: string;
    devStartup: string;
  };
  ecosystem: {
    plugins: number;
    templates: number;
    community: string;
  };
}

// Mock API function
const fetchFrameworkInfo = async (): Promise<FrameworkInfo> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    name: 'Nitro.js',
    version: '1.0.0',
    features: [
      'File-based routing with +route.tsx and +layout.tsx',
      'TanStack Query-like data fetching with caching',
      'Signal-based reactive state management',
      'SSR and SPA modes with same codebase',
      'TypeScript-first development',
      'Vite-powered build system',
      'React 18 with Suspense support',
      'Automatic code splitting',
      'Hot module replacement',
      'Zero configuration setup'
    ],
    performance: {
      bundleSize: '< 50kb gzipped',
      buildTime: '< 2s for typical app',
      devStartup: '< 500ms cold start'
    },
    ecosystem: {
      plugins: 25,
      templates: 8,
      community: 'Growing rapidly'
    }
  };
};

export default function AboutPage() {
  const prefetchQuery = usePrefetchQuery();
  const setQueryData = useSetQueryData();

  const { 
    data: info, 
    isLoading, 
    isError, 
    error,
    refetch,
    isStale 
  } = useQuery({
    queryKey: ['framework-info'],
    queryFn: fetchFrameworkInfo,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handlePrefetchPosts = async () => {
    try {
      await prefetchQuery(['posts', 'lists'], async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [
          { id: 1, title: 'Getting Started with Nitro.js', body: 'Learn the basics...' },
          { id: 2, title: 'Advanced Patterns', body: 'Deep dive into...' }
        ];
      });
      alert('Posts prefetched successfully! Navigate to /posts to see instant loading.');
    } catch (error) {
      alert('Failed to prefetch posts');
    }
  };

  const handleUpdateCache = () => {
    const updatedInfo: FrameworkInfo = {
      ...info!,
      ecosystem: {
        ...info!.ecosystem,
        plugins: info!.ecosystem.plugins + 1,
        community: 'Thriving!'
      }
    };
    setQueryData(['framework-info'], updatedInfo);
  };

  if (isLoading) {
    return (
      <div>
        <h1>About Nitro.js</h1>
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
          <p style={{ margin: 0 }}>Loading framework information...</p>
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

  if (isError) {
    return (
      <div>
        <h1>About Nitro.js</h1>
        <div style={{
          padding: '1rem',
          background: '#ffe6e6',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          color: '#cc0000'
        }}>
          <h3>Error loading information</h3>
          <p>{error?.message || 'An unknown error occurred'}</p>
          <button 
            onClick={() => refetch()}
            style={{
              padding: '0.5rem 1rem',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>About {info.name}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isStale && (
            <span style={{ color: '#ff8800', fontSize: '0.9rem' }}>Data is stale</span>
          )}
          <span style={{ 
            background: '#28a745', 
            color: 'white', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            v{info.version}
          </span>
        </div>
      </div>
      
      <p>
        This is a demonstration of {info.name} running in SPA (Single Page Application) mode
        with advanced data fetching capabilities.
      </p>
      
      <div style={{ display: 'grid', gap: '2rem', marginTop: '2rem' }}>
        <section>
          <h2>How it works</h2>
          <ol style={{ lineHeight: '1.6' }}>
            <li>The Vite plugin is configured with <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>ssr: false</code></li>
            <li>Client entry point uses <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>createRoot(document.getElementById('root')).render()</code></li>
            <li>File-based routing still works with <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>+route.tsx</code> and <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>+layout.tsx</code></li>
            <li>Navigation happens client-side without page reloads</li>
            <li>Data fetching provides caching, background updates, and optimistic UI</li>
          </ol>
        </section>

        <section>
          <h2>Key Features</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {info.features.map((feature, index) => (
              <div 
                key={index}
                style={{
                  padding: '1rem',
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  borderLeft: '4px solid #0066cc'
                }}
              >
                ✅ {feature}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Performance</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ padding: '1rem', background: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {info.performance.bundleSize}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Bundle Size</div>
            </div>
            <div style={{ padding: '1rem', background: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {info.performance.buildTime}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Build Time</div>
            </div>
            <div style={{ padding: '1rem', background: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {info.performance.devStartup}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Dev Startup</div>
            </div>
          </div>
        </section>

        <section>
          <h2>Ecosystem</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>
                {info.ecosystem.plugins}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Plugins</div>
            </div>
            <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>
                {info.ecosystem.templates}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Templates</div>
            </div>
            <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#856404' }}>
                {info.ecosystem.community}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Community</div>
            </div>
          </div>
        </section>

        <section>
          <h2>Data Fetching Demo</h2>
          <p>Try these advanced data fetching features:</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button 
              onClick={handlePrefetchPosts}
              style={{
                padding: '0.75rem 1rem',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🚀 Prefetch Posts
            </button>
            <button 
              onClick={handleUpdateCache}
              style={{
                padding: '0.75rem 1rem',
                background: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📝 Update Cache
            </button>
            <button 
              onClick={() => refetch()}
              style={{
                padding: '0.75rem 1rem',
                background: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Refetch Data
            </button>
          </div>
        </section>

        <section>
          <h2>Configuration</h2>
          <pre style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            overflow: 'auto',
            border: '1px solid #dee2e6'
          }}>{`// vite.config.ts
import { defineConfig } from 'vite';
import { nitro } from 'nitro-js/vite';

export default defineConfig({
  plugins: [
    ...nitro({
      ssr: false, // Enable SPA mode
      clientEntry: 'src/main.tsx'
    })
  ],
});

// src/main.tsx
import { QueryClientProvider, createQueryClient } from 'nitro-js/data-fetching';

const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
    },
  },
});`}</pre>
        </section>
      </div>
    </div>
  );
}