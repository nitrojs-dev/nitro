# Nitro.js

A modern React framework that combines the best of SSR and SPA with powerful data fetching capabilities.

## Features

### 🚀 Dual Rendering Modes
- **Server-Side Rendering (SSR)** with React 18 streaming for SEO and performance
- **Single Page Application (SPA)** mode for interactive client-side apps
- **Same codebase** works in both modes with a simple configuration change
- **Progressive enhancement** and graceful degradation

### � Advanced Data Fetching
- **TanStack Query-like API** with familiar developer experience
- **Automatic caching** with LRU cache and intelligent invalidation
- **Background refetching** and stale-while-revalidate patterns
- **Optimistic updates** and mutations with rollback
- **Request deduplication** and retry logic
- **Signal-based reactive queries** for fine-grained reactivity
- **SSR integration** with dehydration/rehydration

### 🛣️ File-Based Routing
- **Zero configuration** routing with `+route.tsx` and `+layout.tsx` conventions
- **Dynamic routes** with parameters (`$id`, `$slug`)
- **Nested layouts** and error boundaries
- **Client-side navigation** with view transitions
- **Route grouping** with `(group)` syntax

### ⚡ Developer Experience
- **TypeScript-first** development with full type safety
- **Vite-powered** build system with HMR
- **Hot module replacement** for instant feedback
- **Automatic code splitting** and lazy loading
- **Modern tooling** integration

### 🎯 Performance Optimized
- **Streaming SSR** for faster Time to First Byte
- **Bundle size < 50kb** gzipped with tree shaking
- **Build times < 2s** for typical applications
- **Dev startup < 500ms** cold start
- **Efficient caching** strategies

## Quick Start

### Installation

```bash
npm install nitro-js@npm:nitro-tsx@latest
```

### SPA Mode Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { nitro } from 'nitro-js/vite';

export default defineConfig({
  plugins: [
    ...nitro({
      ssr: false, // SPA mode
      clientEntry: 'src/main.tsx'
    })
  ],
});
```

```typescript
// src/main.tsx
import { createRoot } from 'react-dom/client';
import { NitroBrowser } from 'nitro-js/router';
import { QueryClientProvider, createQueryClient } from 'nitro-js/query';

const queryClient = createQueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <NitroBrowser />
  </QueryClientProvider>
);
```

### SSR Mode Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { nitro } from 'nitro-js/vite';

export default defineConfig({
  plugins: [
    ...nitro({
      ssr: true, // SSR mode
      handlerPath: 'src/entry.server.tsx'
    })
  ],
});
```

```typescript
// src/entry.server.tsx
import { renderToReadableStream } from 'react-dom/server';
import { NitroServer, createNitroHandler } from 'nitro-js/router';
import { QueryClientProvider, createQueryClient } from 'nitro-js/query';

export default async function handler(request) {
  const queryClient = createQueryClient();
  const context = await createNitroHandler()(request);
  
  const stream = await renderToReadableStream(
    <QueryClientProvider client={queryClient}>
      <NitroServer context={context} />
    </QueryClientProvider>
  );
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

```typescript
// src/entry.client.tsx
import { hydrateRoot } from 'react-dom/client';
import { NitroBrowser } from 'nitro-js/router';
import { QueryClientProvider, createQueryClient } from 'nitro-js/query';

const queryClient = createQueryClient();

hydrateRoot(
  document.getElementById('root')!,
  <QueryClientProvider client={queryClient}>
    <NitroBrowser />
  </QueryClientProvider>
);
```

## File-Based Routing

Create routes using file conventions:

```
src/app/
├── +layout.tsx          # Root layout
├── +route.tsx           # Home page (/)
├── about/
│   └── +route.tsx       # About page (/about)
├── posts/
│   ├── +route.tsx       # Posts list (/posts)
│   └── $id/
│       └── +route.tsx   # Post detail (/posts/:id)
└── (admin)/
    └── dashboard/
        └── +route.tsx   # Admin dashboard (/dashboard)
```

### Layout Component

```typescript
// src/app/+layout.tsx
import { Outlet, Link } from 'nitro-js/router';

export default function RootLayout() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>My Nitro.js App</title>
      </head>
      <body>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/posts">Posts</Link>
        </nav>
        <main>
          <Outlet />
        </main>
      </body>
    </html>
  );
}
```

### Route Component

```typescript
// src/app/posts/+route.tsx
import { useQuery } from 'nitro-js/query';

export default function PostsPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading posts...</div>;

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts?.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

## Data Fetching

### Basic Queries

```typescript
import { useQuery, createQueryKeys } from 'nitro-js/query';

const postKeys = createQueryKeys('posts');

function PostsList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: postKeys.lists(),
    queryFn: fetchPosts,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data?.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
```

### Mutations with Optimistic Updates

```typescript
import { useMutation, useInvalidateQueries } from 'nitro-js/query';

function LikeButton({ postId }) {
  const invalidateQueries = useInvalidateQueries();
  
  const likeMutation = useMutation({
    mutationFn: ({ postId }) => likePost(postId),
    onMutate: async ({ postId }) => {
      // Optimistic update
      const previousPost = queryClient.getQueryData(['posts', postId]);
      queryClient.setQueryData(['posts', postId], old => ({
        ...old,
        likes: old.likes + 1
      }));
      return { previousPost };
    },
    onSuccess: (data, { postId }) => {
      invalidateQueries(['posts', postId]);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(['posts', variables.postId], context.previousPost);
    },
  });

  return (
    <button 
      onClick={() => likeMutation.mutate({ postId })}
      disabled={likeMutation.isPending}
    >
      {likeMutation.isPending ? 'Liking...' : 'Like'}
    </button>
  );
}
```

### Signal-Based Queries

```typescript
import { useQuerySignal } from 'nitro-js/query';

function ReactiveStats() {
  const [statsSignal, { isLoading, refetch }] = useQuerySignal(
    ['stats'],
    fetchStats,
    { refetchInterval: 10 * 1000 }
  );

  // Signal automatically updates the component
  const stats = statsSignal();

  return (
    <div>
      <h2>Live Stats</h2>
      <p>Users: {stats?.users}</p>
      <p>Posts: {stats?.posts}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

## State Management

```typescript
import { useSignal } from 'nitro-js/state';

function Counter() {
  const [count, setCount] = useSignal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

## Examples

### SPA Example
Complete single-page application demonstrating:
- Client-side routing and navigation
- Data fetching with caching and background updates
- Optimistic mutations and error handling
- Signal-based reactive state
- Interactive components and real-time updates

```bash
cd examples/spa-example
npm install
npm run dev
```

### SSR Example
Full server-side rendering application showcasing:
- Streaming SSR with React 18
- Server-side data fetching and hydration
- SEO optimization and social sharing
- Real-time dashboard with analytics
- Progressive enhancement patterns

```bash
cd examples/ssr-example
npm install
npm run dev
```

## API Reference

### Vite Plugin Options

```typescript
interface NitroOptions {
  /** Enable SSR (true) or SPA mode (false). Default: true */
  ssr?: boolean;
  /** Custom path to server entry. Default: 'src/entry.server.tsx' */
  handlerPath?: string;
  /** Custom path to client entry for SPA. Default: 'src/main.tsx' */
  clientEntry?: string;
  /** React plugin configuration */
  reactPlugin?: Options;
}
```

### Data Fetching Hooks

- `useQuery(options)` - Fetch and cache data
- `useMutation(options)` - Perform mutations with optimistic updates
- `useQuerySignal(key, fn, options)` - Signal-based reactive queries
- `useInvalidateQueries()` - Invalidate cached queries
- `usePrefetchQuery()` - Prefetch data for better UX
- `useSetQueryData()` - Manually update cache

### Router Components

- `<NitroBrowser />` - Client-side router for SPA mode
- `<NitroServer />` - Server-side router for SSR mode
- `<Link />` - Navigation component with view transitions
- `<Outlet />` - Render child routes in layouts

### State Management

- `useSignal(initialValue)` - Reactive state primitive
- `createSignal(initialValue)` - Create standalone signal
- `computed(fn)` - Derived reactive values
- `effect(fn)` - Side effects with automatic cleanup

## Performance

### Bundle Size
- **Core runtime**: ~30kb gzipped
- **With data fetching**: ~45kb gzipped
- **Full framework**: <50kb gzipped

### Build Performance
- **Cold start**: <500ms
- **HMR updates**: <100ms
- **Production build**: <2s for typical app

### Runtime Performance
- **SSR TTFB**: <100ms
- **Client hydration**: <50ms
- **Route transitions**: <16ms (60fps)

## Browser Support

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **SSR**: Node.js 18+ or Edge Runtime
- **Progressive enhancement**: Works without JavaScript

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.