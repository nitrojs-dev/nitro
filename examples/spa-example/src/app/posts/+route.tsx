import { Link } from 'react-router';
import { useQuery, createQueryKeys } from 'nitro-js/query';

interface Post {
  id: number;
  title: string;
  body: string;
}

// Create query keys for posts
const postKeys = createQueryKeys('posts');

// Mock API function
const fetchPosts = async (): Promise<Post[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate API response
  return [
    { id: 1, title: 'Getting Started with Nitro.js', body: 'Learn how to build modern React applications with Nitro.js data fetching...' },
    { id: 2, title: 'SPA vs SSR: When to Use Each', body: 'Understanding the trade-offs between different rendering modes and when to choose each...' },
    { id: 3, title: 'File-based Routing Explained', body: 'How Nitro.js uses file conventions for routing and why it makes development faster...' },
    { id: 4, title: 'Advanced Data Fetching Patterns', body: 'Explore optimistic updates, background refetching, and caching strategies...' },
    { id: 5, title: 'State Management with Signals', body: 'Learn how to use Nitro.js signals for reactive state management...' }
  ];
};

export default function PostsPage() {
  const { 
    data: posts, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching,
    isStale 
  } = useQuery({
    queryKey: postKeys.lists(),
    queryFn: fetchPosts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div>
        <h1>Posts</h1>
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
          <p style={{ margin: 0 }}>Loading posts with Nitro.js data fetching...</p>
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
        <h1>Posts</h1>
        <div style={{
          padding: '1rem',
          background: '#ffe6e6',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          color: '#cc0000'
        }}>
          <h3>Error loading posts</h3>
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Blog Posts</h1>
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
          {isStale && !isFetching && (
            <span style={{ color: '#ff8800', fontSize: '0.9rem' }}>Data is stale</span>
          )}
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              padding: '0.5rem 1rem',
              background: isFetching ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isFetching ? 'not-allowed' : 'pointer'
            }}
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <p>Demonstrating Nitro.js data fetching with caching, background updates, and error handling:</p>
      
      <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
        {posts?.map(post => (
          <article 
            key={post.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              background: '#fafafa',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h2 style={{ margin: '0 0 0.5rem 0' }}>
              <Link 
                to={`/posts/${post.id}`}
                style={{ color: '#0066cc', textDecoration: 'none' }}
              >
                {post.title}
              </Link>
            </h2>
            <p style={{ margin: 0, color: '#666' }}>{post.body}</p>
          </article>
        ))}
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f0f8ff', 
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Data Fetching Features:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>✅ Automatic caching with LRU cache</li>
          <li>✅ Background refetching every 5 minutes</li>
          <li>✅ Stale-while-revalidate pattern</li>
          <li>✅ Error handling with retry</li>
          <li>✅ Loading states and optimistic updates</li>
          <li>✅ Request deduplication</li>
        </ul>
      </div>
    </div>
  );
}