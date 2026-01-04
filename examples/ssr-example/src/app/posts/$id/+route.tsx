import { useParams, Link } from 'nitro-js/router';
import { useQuery, useMutation, useInvalidateQueries, createQueryKeys } from 'nitro-js/query';

interface Post {
  id: number;
  title: string;
  body: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: number;
  likes: number;
  views: number;
  tags: string[];
}

interface LikePostVariables {
  postId: number;
}

// Create query keys for posts
const postKeys = createQueryKeys('posts');

// Mock API functions
const fetchPost = async (postId: string): Promise<Post> => {
  // Simulate server processing time
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const posts: Record<string, Post> = {
    '1': {
      id: 1,
      title: 'Server-Side Rendering with Nitro.js',
      body: 'Learn how to implement SSR with data fetching, caching, and hydration in Nitro.js applications.',
      author: 'Jane Developer',
      publishedAt: '2024-01-15T10:00:00Z',
      readTime: 8,
      likes: 127,
      views: 2341,
      tags: ['SSR', 'React', 'Performance'],
      content: `
Server-Side Rendering (SSR) with Nitro.js provides the best of both worlds: fast initial page loads and rich client-side interactivity.

## Why Choose SSR?

SSR offers several key advantages over client-side rendering:

**Performance Benefits:**
• Faster Time to First Contentful Paint (FCP)
• Better Core Web Vitals scores
• Reduced JavaScript bundle size impact on initial load
• Progressive enhancement capabilities

**SEO and Accessibility:**
• Search engines can crawl fully rendered HTML
• Social media platforms can generate rich previews
• Screen readers have immediate access to content
• Works even when JavaScript is disabled

**User Experience:**
• Content is visible immediately
• Perceived performance improvements
• Better experience on slow networks
• Graceful degradation

## Implementation with Nitro.js

Nitro.js makes SSR implementation straightforward:

1. **Server Entry Point**: Define your server handler that renders React to HTML
2. **Client Entry Point**: Hydrate the server-rendered HTML on the client
3. **Data Fetching**: Use the same query hooks on both server and client
4. **Routing**: File-based routing works seamlessly in both environments

The data fetching system automatically handles:
• Server-side query execution during rendering
• Client-side hydration of query results
• Cache synchronization between server and client
• Background refetching after hydration

This approach ensures your users get the fastest possible initial experience while maintaining all the benefits of a modern React application.
      `
    },
    '2': {
      id: 2,
      title: 'Data Fetching Patterns in SSR',
      body: 'Explore advanced patterns for server-side data fetching, including parallel queries and error boundaries.',
      author: 'John Engineer',
      publishedAt: '2024-01-12T14:30:00Z',
      readTime: 12,
      likes: 89,
      views: 1567,
      tags: ['Data Fetching', 'Patterns', 'Architecture'],
      content: `
Advanced data fetching patterns in SSR applications require careful consideration of performance, error handling, and user experience.

## Parallel Query Execution

When multiple queries are needed for a single page, executing them in parallel significantly improves performance:

**Benefits:**
• Reduced total loading time
• Better server resource utilization
• Improved user experience
• Lower Time to Interactive (TTI)

**Implementation Strategies:**
• Use Promise.all() for independent queries
• Implement query batching for related data
• Consider query dependencies and waterfall effects
• Optimize database queries and API calls

## Error Boundary Patterns

Robust error handling is crucial for SSR applications:

**Server-Side Error Handling:**
• Graceful degradation when queries fail
• Fallback content for partial failures
• Proper HTTP status codes
• Error logging and monitoring

**Client-Side Hydration:**
• Error boundary components
• Retry mechanisms
• User-friendly error messages
• Progressive enhancement fallbacks

## Caching Strategies

Effective caching improves both performance and scalability:

**Server-Side Caching:**
• Query result caching
• CDN integration
• Edge computing optimization
• Database query optimization

**Client-Side Caching:**
• Hydration state management
• Background refetching
• Optimistic updates
• Cache invalidation strategies

These patterns ensure your SSR application remains fast, reliable, and maintainable as it scales.
      `
    },
    '3': {
      id: 3,
      title: 'Optimizing SSR Performance',
      body: 'Best practices for optimizing server-side rendering performance with caching and streaming.',
      author: 'Sarah Architect',
      publishedAt: '2024-01-10T09:15:00Z',
      readTime: 15,
      likes: 203,
      views: 3421,
      tags: ['Performance', 'Optimization', 'Caching'],
      content: `
Performance optimization in SSR applications involves multiple layers: server rendering, data fetching, caching, and client hydration.

## Server Rendering Optimization

**Rendering Performance:**
• Component-level code splitting
• Lazy loading for non-critical components
• Server-side rendering caching
• Template compilation optimization

**Memory Management:**
• Query client lifecycle management
• Garbage collection optimization
• Memory leak prevention
• Resource cleanup strategies

## Data Fetching Optimization

**Query Optimization:**
• Database query optimization
• API response caching
• Request deduplication
• Parallel query execution

**Network Optimization:**
• CDN utilization
• Edge computing
• Compression strategies
• HTTP/2 and HTTP/3 benefits

## Caching Strategies

**Multi-Level Caching:**
• Browser caching
• CDN caching
• Server-side caching
• Database query caching

**Cache Invalidation:**
• Time-based expiration
• Event-driven invalidation
• Selective cache clearing
• Cache warming strategies

## Streaming and Progressive Enhancement

**Streaming SSR:**
• React 18 Suspense integration
• Progressive content delivery
• Reduced Time to First Byte (TTFB)
• Better perceived performance

**Progressive Enhancement:**
• Core functionality without JavaScript
• Enhanced features with JavaScript
• Graceful degradation
• Accessibility considerations

These optimization techniques ensure your SSR application delivers exceptional performance across all devices and network conditions.
      `
    }
  };
  
  const post = posts[postId];
  if (!post) {
    throw new Error(`Post with ID "${postId}" not found`);
  }
  
  return post;
};

const likePost = async ({ postId }: LikePostVariables): Promise<{ likes: number }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Simulate random failure 5% of the time
  if (Math.random() < 0.05) {
    throw new Error('Failed to like post. Please try again.');
  }
  
  // Return new like count (simulate increment)
  return { likes: Math.floor(Math.random() * 300) + 100 };
};

export default function PostDetailPage() {
  const { id } = useParams();
  const invalidateQueries = useInvalidateQueries();

  // This query will be executed on the server during SSR
  const { 
    data: post, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: postKeys.detail(id!),
    queryFn: () => fetchPost(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for SSR
    // Disable background refetching for SSR
    refetchInterval: false,
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onSuccess: (data, variables) => {
      // Invalidate and refetch post data
      invalidateQueries(postKeys.detail(variables.postId));
      invalidateQueries(postKeys.lists());
    },
    onError: (error) => {
      console.error('Failed to like post:', error);
    },
    retry: 1, // Reduced retry for better UX
  });

  if (isLoading) {
    return (
      <div>
        <Link to="/posts">← Back to Posts</Link>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '2rem',
          background: '#f0f8ff',
          borderRadius: '8px',
          border: '1px solid #0066cc',
          marginTop: '1rem'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #0066cc',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ margin: 0 }}>Loading post from server...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <Link to="/posts">← Back to Posts</Link>
        <div style={{
          padding: '1rem',
          background: '#ffe6e6',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          color: '#cc0000',
          marginTop: '1rem'
        }}>
          <h3>Error loading post</h3>
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

  if (!post) {
    return (
      <div>
        <Link to="/posts">← Back to Posts</Link>
        <h1>Post Not Found</h1>
        <p>The post with ID "{id}" could not be found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/posts">← Back to Posts</Link>
      <article style={{ marginTop: '1rem' }}>
        <header style={{ 
          borderBottom: '2px solid #eee', 
          paddingBottom: '1.5rem', 
          marginBottom: '2rem' 
        }}>
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '2.5rem', lineHeight: '1.2' }}>
            {post.title}
          </h1>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '1rem', 
            alignItems: 'center',
            marginBottom: '1rem',
            color: '#666',
            fontSize: '0.95rem'
          }}>
            <span>👤 {post.author}</span>
            <span>📅 {new Date(post.publishedAt).toLocaleDateString()}</span>
            <span>⏱️ {post.readTime} min read</span>
            <span>👁️ {post.views.toLocaleString()} views</span>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>❤️ {post.likes} likes</span>
              <button
                onClick={() => likeMutation.mutate({ postId: post.id })}
                disabled={likeMutation.isPending}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: likeMutation.isPending ? '#ccc' : '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: likeMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                {likeMutation.isPending ? 'Liking...' : '👍 Like'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span 
                key={tag}
                style={{
                  background: '#e3f2fd',
                  color: '#1976d2',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {likeMutation.isError && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#ffe6e6',
              border: '1px solid #ff4444',
              borderRadius: '8px',
              color: '#cc0000',
              fontSize: '0.9rem'
            }}>
              ❌ {likeMutation.error?.message || 'Failed to like post'}
            </div>
          )}
          {likeMutation.isSuccess && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#e6ffe6',
              border: '1px solid #44ff44',
              borderRadius: '8px',
              color: '#006600',
              fontSize: '0.9rem'
            }}>
              ✅ Post liked successfully! Thank you for your feedback. 🎉
            </div>
          )}
        </header>
        
        <div style={{ 
          whiteSpace: 'pre-line', 
          lineHeight: '1.7',
          color: '#333',
          fontSize: '1.1rem',
          maxWidth: '800px'
        }}>
          {post.content}
        </div>

        <footer style={{ 
          marginTop: '3rem', 
          padding: '1.5rem', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>SSR Features Demonstrated:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <strong style={{ color: '#0066cc' }}>🚀 Server-Side Data Fetching</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                Post content is fetched on the server and included in the HTML response
              </p>
            </div>
            <div>
              <strong style={{ color: '#28a745' }}>⚡ Client-Side Hydration</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                Interactive features like the like button work after JavaScript loads
              </p>
            </div>
            <div>
              <strong style={{ color: '#ffc107' }}>🔍 SEO Optimized</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                Full content is available to search engines and social media crawlers
              </p>
            </div>
            <div>
              <strong style={{ color: '#dc3545' }}>📱 Progressive Enhancement</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                Content is readable even if JavaScript fails to load
              </p>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}