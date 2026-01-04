import { Link } from 'nitro-js/router';
import { useQuery, createQueryKeys } from 'nitro-js/data-fetching';

interface Post {
  id: number;
  title: string;
  body: string;
  author: string;
  publishedAt: string;
  readTime: number;
}

// Create query keys for posts
const postKeys = createQueryKeys('posts');

// Mock API function - this will run on the server during SSR
const fetchPosts = async (): Promise<Post[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    { 
      id: 1, 
      title: 'Server-Side Rendering with Nitro.js', 
      body: 'Learn how to implement SSR with data fetching, caching, and hydration in Nitro.js applications.',
      author: 'Jane Developer',
      publishedAt: '2024-01-15T10:00:00Z',
      readTime: 8
    },
    { 
      id: 2, 
      title: 'Data Fetching Patterns in SSR', 
      body: 'Explore advanced patterns for server-side data fetching, including parallel queries and error boundaries.',
      author: 'John Engineer',
      publishedAt: '2024-01-12T14:30:00Z',
      readTime: 12
    },
    { 
      id: 3, 
      title: 'Optimizing SSR Performance', 
      body: 'Best practices for optimizing server-side rendering performance with caching and streaming.',
      author: 'Sarah Architect',
      publishedAt: '2024-01-10T09:15:00Z',
      readTime: 15
    },
    { 
      id: 4, 
      title: 'SEO Benefits of Server-Side Rendering', 
      body: 'How SSR improves search engine optimization and social media sharing for your applications.',
      author: 'Mike SEO',
      publishedAt: '2024-01-08T16:45:00Z',
      readTime: 6
    },
    { 
      id: 5, 
      title: 'Hydration and Client-Side Interactivity', 
      body: 'Understanding the hydration process and maintaining smooth client-side interactions after SSR.',
      author: 'Lisa Frontend',
      publishedAt: '2024-01-05T11:20:00Z',
      readTime: 10
    }
  ];
};

export default function PostsPage() {
  // This query will be executed on the server during SSR
  const { 
    data: posts, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: postKeys.lists(),
    queryFn: fetchPosts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // No background refetching for SSR to avoid unnecessary server load
    refetchInterval: false,
  });

  if (isLoading) {
    return (
      <div>
        <h1>Blog Posts</h1>
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
          <p style={{ margin: 0 }}>Loading posts from server...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1>Blog Posts</h1>
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
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
              <span>Refreshing...</span>
            </div>
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
            {isFetching ? 'Refreshing...' : 'Refresh Posts'}
          </button>
        </div>
      </div>
      
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        These posts were fetched on the server and included in the initial HTML response. 
        The page loads instantly with all content visible to search engines and users.
      </p>
      
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {posts?.map(post => (
          <article 
            key={post.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '1.5rem',
              background: '#fafafa',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <header style={{ marginBottom: '1rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>
                <Link 
                  to={`/posts/${post.id}`}
                  style={{ 
                    color: '#0066cc', 
                    textDecoration: 'none',
                    fontSize: '1.3rem',
                    fontWeight: 'bold'
                  }}
                >
                  {post.title}
                </Link>
              </h2>
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                alignItems: 'center',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                <span>👤 {post.author}</span>
                <span>📅 {new Date(post.publishedAt).toLocaleDateString()}</span>
                <span>⏱️ {post.readTime} min read</span>
              </div>
            </header>
            <p style={{ margin: 0, color: '#555', lineHeight: '1.6' }}>{post.body}</p>
          </article>
        ))}
      </div>

      <div style={{ 
        marginTop: '3rem', 
        padding: '1.5rem', 
        background: '#f0f8ff', 
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>SSR Data Fetching Benefits:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <strong style={{ color: '#0066cc' }}>🚀 Instant Content</strong>
            <p style={{ margin: '0.5rem 0 0 0' }}>Posts are rendered on the server and sent with the HTML</p>
          </div>
          <div>
            <strong style={{ color: '#28a745' }}>🔍 SEO Optimized</strong>
            <p style={{ margin: '0.5rem 0 0 0' }}>Search engines can index all post content immediately</p>
          </div>
          <div>
            <strong style={{ color: '#ffc107' }}>📱 Better UX</strong>
            <p style={{ margin: '0.5rem 0 0 0' }}>Users see content before JavaScript loads</p>
          </div>
          <div>
            <strong style={{ color: '#dc3545' }}>⚡ Fast Navigation</strong>
            <p style={{ margin: '0.5rem 0 0 0' }}>Client-side routing after hydration</p>
          </div>
        </div>
      </div>
    </div>
  );
}