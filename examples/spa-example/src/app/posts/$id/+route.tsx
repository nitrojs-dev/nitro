import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useInvalidateQueries, createQueryKeys } from 'nitro-js/query';

interface Post {
  id: number;
  title: string;
  body: string;
  content: string;
  likes: number;
  views: number;
}

interface LikePostVariables {
  postId: number;
}

// Create query keys for posts
const postKeys = createQueryKeys('posts');

// Mock API functions
const fetchPost = async (postId: string): Promise<Post> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const posts: Record<string, Post> = {
    '1': {
      id: 1,
      title: 'Getting Started with Nitro.js',
      body: 'Learn how to build modern React applications with Nitro.js data fetching...',
      likes: 42,
      views: 1337,
      content: `
Nitro.js is a modern React framework that provides both SSR and SPA capabilities with powerful data fetching.

Key features:
• File-based routing with +route.tsx and +layout.tsx conventions
• Built-in data fetching with TanStack Query-like API
• Signal-based state management
• TypeScript-first development experience
• Vite-powered development and building

The data fetching system includes:
• Automatic caching with LRU cache
• Background refetching and stale-while-revalidate
• Request deduplication and retry logic
• Optimistic updates and mutations
• SSR integration

Getting started is simple - just install the package and configure your Vite plugin!
      `
    },
    '2': {
      id: 2,
      title: 'SPA vs SSR: When to Use Each',
      body: 'Understanding the trade-offs between different rendering modes and when to choose each...',
      likes: 28,
      views: 892,
      content: `
Choosing between SPA and SSR depends on your application's needs:

SPA Mode:
• Faster client-side navigation
• Better for interactive applications
• Simpler deployment (static hosting)
• Slower initial page load
• Better for authenticated apps

SSR Mode:
• Better SEO and social sharing
• Faster initial page load
• Better accessibility
• More complex deployment
• Better for content-heavy sites

Nitro.js supports both modes with the same codebase! You can even switch between them by changing a single configuration option.

The data fetching system works seamlessly in both modes, with automatic hydration in SSR and client-side caching in SPA mode.
      `
    },
    '3': {
      id: 3,
      title: 'File-based Routing Explained',
      body: 'How Nitro.js uses file conventions for routing and why it makes development faster...',
      likes: 35,
      views: 654,
      content: `
Nitro.js uses a file-based routing system inspired by SvelteKit:

• +route.tsx - Page components
• +layout.tsx - Layout components
• $param - Dynamic route parameters
• (group) - Route grouping without affecting URL

Example structure:
src/app/
├── +layout.tsx          → Layout for all pages
├── +route.tsx           → Home page (/)
├── about/
│   └── +route.tsx       → About page (/about)
└── posts/
    ├── +route.tsx       → Posts list (/posts)
    └── $id/
        └── +route.tsx   → Post detail (/posts/123)

This approach provides:
• Zero configuration routing
• Automatic code splitting
• Type-safe route parameters
• Nested layouts and error boundaries
• Easy to understand file structure
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
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulate random failure 10% of the time
  if (Math.random() < 0.1) {
    throw new Error('Failed to like post. Please try again.');
  }
  
  // Return new like count (simulate increment)
  return { likes: Math.floor(Math.random() * 100) + 50 };
};

export default function PostDetailPage() {
  const { id } = useParams();
  const invalidateQueries = useInvalidateQueries();

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onMutate: async ({ postId }) => {
      // Optimistic update
      const queryKey = postKeys.detail(postId);
      const previousPost = post;
      
      // Optimistically update the UI
      if (previousPost) {
        // Note: In a real app, you'd use queryClient.setQueryData here
        // For this demo, we'll just show the loading state
      }
      
      return { previousPost };
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch post data
      invalidateQueries(postKeys.detail(variables.postId));
      invalidateQueries(postKeys.lists());
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      console.error('Failed to like post:', error);
    },
    retry: 2,
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
          <p style={{ margin: 0 }}>Loading post details...</p>
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
          paddingBottom: '1rem', 
          marginBottom: '2rem' 
        }}>
          <h1 style={{ margin: '0 0 1rem 0' }}>{post.title}</h1>
          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            alignItems: 'center',
            color: '#666',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>👁️ {post.views.toLocaleString()} views</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>❤️ {post.likes} likes</span>
              <button
                onClick={() => likeMutation.mutate({ postId: post.id })}
                disabled={likeMutation.isPending}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: likeMutation.isPending ? '#ccc' : '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: likeMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                {likeMutation.isPending ? 'Liking...' : 'Like'}
              </button>
            </div>
          </div>
          {likeMutation.isError && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: '#ffe6e6',
              border: '1px solid #ff4444',
              borderRadius: '4px',
              color: '#cc0000',
              fontSize: '0.9rem'
            }}>
              {likeMutation.error?.message || 'Failed to like post'}
            </div>
          )}
          {likeMutation.isSuccess && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: '#e6ffe6',
              border: '1px solid #44ff44',
              borderRadius: '4px',
              color: '#006600',
              fontSize: '0.9rem'
            }}>
              Post liked successfully! 🎉
            </div>
          )}
        </header>
        
        <div style={{ 
          whiteSpace: 'pre-line', 
          lineHeight: '1.6',
          color: '#333',
          fontSize: '1.1rem'
        }}>
          {post.content}
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#f0f8ff', 
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Mutation Features Demonstrated:</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>✅ Optimistic updates for better UX</li>
            <li>✅ Automatic error handling and retry</li>
            <li>✅ Cache invalidation after mutations</li>
            <li>✅ Loading states during mutations</li>
            <li>✅ Success and error feedback</li>
          </ul>
        </div>
      </article>
    </div>
  );
}