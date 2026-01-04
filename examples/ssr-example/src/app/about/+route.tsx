import { useQuery, usePrefetchQuery } from 'nitro-js/query';

interface FrameworkInfo {
  name: string;
  version: string;
  description: string;
  features: {
    category: string;
    items: string[];
  }[];
  performance: {
    metric: string;
    value: string;
    description: string;
  }[];
  comparison: {
    framework: string;
    ssr: boolean;
    bundleSize: string;
    performance: string;
  }[];
}

// Mock API function - this will run on the server during SSR
const fetchFrameworkInfo = async (): Promise<FrameworkInfo> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return {
    name: 'Nitro.js',
    version: '1.0.0',
    description: 'A modern React framework that combines the best of SSR and SPA with powerful data fetching capabilities.',
    features: [
      {
        category: 'Rendering',
        items: [
          'Server-Side Rendering (SSR) with hydration',
          'Single Page Application (SPA) mode',
          'Same codebase for both SSR and SPA',
          'Progressive enhancement support',
          'React 18 Suspense integration'
        ]
      },
      {
        category: 'Data Fetching',
        items: [
          'TanStack Query-like API',
          'Automatic caching with LRU cache',
          'Background refetching and stale-while-revalidate',
          'Optimistic updates and mutations',
          'Request deduplication and retry logic',
          'Signal-based reactive queries'
        ]
      },
      {
        category: 'Routing',
        items: [
          'File-based routing with +route.tsx and +layout.tsx',
          'Dynamic routes with parameters',
          'Nested layouts and error boundaries',
          'Client-side navigation with view transitions',
          'Zero configuration setup'
        ]
      },
      {
        category: 'Developer Experience',
        items: [
          'TypeScript-first development',
          'Vite-powered build system',
          'Hot module replacement',
          'Automatic code splitting',
          'Modern tooling integration'
        ]
      }
    ],
    performance: [
      {
        metric: 'Bundle Size',
        value: '< 50kb gzipped',
        description: 'Minimal runtime overhead with tree-shaking optimization'
      },
      {
        metric: 'Build Time',
        value: '< 2s for typical app',
        description: 'Fast builds powered by Vite and SWC'
      },
      {
        metric: 'Dev Startup',
        value: '< 500ms cold start',
        description: 'Instant development server startup'
      },
      {
        metric: 'SSR Performance',
        value: '< 100ms TTFB',
        description: 'Fast server-side rendering with efficient caching'
      }
    ],
    comparison: [
      {
        framework: 'Next.js',
        ssr: true,
        bundleSize: '~85kb',
        performance: 'Good'
      },
      {
        framework: 'Remix',
        ssr: true,
        bundleSize: '~70kb',
        performance: 'Very Good'
      },
      {
        framework: 'Nitro.js',
        ssr: true,
        bundleSize: '~50kb',
        performance: 'Excellent'
      },
      {
        framework: 'Create React App',
        ssr: false,
        bundleSize: '~45kb',
        performance: 'Good (SPA only)'
      }
    ]
  };
};

export default function AboutPage() {
  const prefetchQuery = usePrefetchQuery();

  // This query will be executed on the server during SSR
  const { 
    data: info, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['framework-info'],
    queryFn: fetchFrameworkInfo,
    staleTime: 10 * 60 * 1000, // 10 minutes
    // No background refetching for SSR
    refetchInterval: false,
  });

  const handlePrefetchPosts = async () => {
    try {
      await prefetchQuery(['posts', 'lists'], async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          title: `Sample Post ${i + 1}`,
          body: 'This is a prefetched post...'
        }));
      });
      alert('Posts prefetched successfully! Navigate to /posts to see instant loading.');
    } catch (error) {
      alert('Failed to prefetch posts');
    }
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
          <p style={{ margin: 0 }}>Loading framework information from server...</p>
        </div>
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
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: '#0066cc' }}>
          {info.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ 
            background: '#28a745', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}>
            v{info.version}
          </span>
          <span style={{ 
            background: '#17a2b8', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px',
            fontSize: '0.9rem'
          }}>
            SSR Ready
          </span>
        </div>
        <p style={{ fontSize: '1.2rem', color: '#666', lineHeight: '1.6', maxWidth: '800px' }}>
          {info.description}
        </p>
      </header>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#333', marginBottom: '2rem' }}>Key Features</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}>
          {info.features.map((category, index) => (
            <div 
              key={index}
              style={{
                padding: '1.5rem',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '12px',
                borderLeft: '4px solid #0066cc'
              }}
            >
              <h3 style={{ margin: '0 0 1rem 0', color: '#0066cc' }}>
                {category.category}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex} style={{ marginBottom: '0.5rem', color: '#555' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#333', marginBottom: '2rem' }}>Performance Metrics</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {info.performance.map((metric, index) => (
            <div 
              key={index}
              style={{
                padding: '2rem',
                background: 'white',
                border: '2px solid #28a745',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
                {metric.value}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
                {metric.metric}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {metric.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#333', marginBottom: '2rem' }}>Framework Comparison</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Framework</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>SSR Support</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Bundle Size</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {info.comparison.map((item, index) => (
                <tr key={index} style={{ 
                  borderBottom: '1px solid #dee2e6',
                  background: item.framework === 'Nitro.js' ? '#e8f5e8' : 'white'
                }}>
                  <td style={{ 
                    padding: '1rem', 
                    fontWeight: item.framework === 'Nitro.js' ? 'bold' : 'normal',
                    color: item.framework === 'Nitro.js' ? '#28a745' : '#333'
                  }}>
                    {item.framework}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {item.ssr ? '✅' : '❌'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {item.bundleSize}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {item.performance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#333', marginBottom: '2rem' }}>Try It Out</h2>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          padding: '2rem',
          background: '#f0f8ff',
          borderRadius: '12px',
          border: '1px solid #0066cc'
        }}>
          <button 
            onClick={handlePrefetchPosts}
            style={{
              padding: '1rem 2rem',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#138496';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#17a2b8';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🚀 Prefetch Posts
          </button>
          <button 
            onClick={() => refetch()}
            style={{
              padding: '1rem 2rem',
              background: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a32a3';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6f42c1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🔄 Refresh Data
          </button>
        </div>
        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          This page was server-side rendered with all data included in the initial HTML response. 
          Interactive features are enhanced after JavaScript loads and hydrates the page.
        </p>
      </section>
    </div>
  );
}