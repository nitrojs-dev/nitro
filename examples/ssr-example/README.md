# Nitro.js SSR Example

This example demonstrates how to use Nitro.js in SSR (Server-Side Rendering) mode with advanced data fetching, streaming, and hydration capabilities.

## Features

- ✅ **Server-Side Rendering (SSR)** with React 18 streaming
- ✅ **Full HTML document structure** in layout components
- ✅ **Client-side hydration** with seamless state transfer
- ✅ **TanStack Query-like data fetching** on server and client
- ✅ **Automatic caching** with LRU cache and dehydration/rehydration
- ✅ **File-based routing** with `+route.tsx` and `+layout.tsx`
- ✅ **Dynamic routes** with parameters
- ✅ **Streaming SSR** for better performance
- ✅ **Background refetching** after hydration
- ✅ **Optimistic updates** and mutations
- ✅ **Error boundaries** and graceful error handling
- ✅ **TypeScript support** throughout

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

4. Build for production:
```bash
npm run build
```

5. Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── entry.server.tsx      # SSR entry point with streaming
├── entry.client.tsx      # Client hydration entry point
└── app/                  # File-based routes
    ├── +layout.tsx       # Root layout with full HTML document
    ├── +route.tsx        # Home page (/) - Server stats with real-time updates
    ├── about/
    │   └── +route.tsx    # About page (/about) - Framework info and prefetching
    ├── posts/
    │   ├── +route.tsx    # Posts list (/posts) - SSR data fetching
    │   └── $id/
    │       └── +route.tsx # Post detail (/posts/:id) - Mutations and likes
    └── dashboard/
        └── +route.tsx    # Dashboard (/dashboard) - Real-time analytics
```

## SSR Architecture

### Server Entry (`src/entry.server.tsx`)
- **Streaming SSR** with `renderToReadableStream`
- **Query client per request** to prevent data leaking
- **Dehydrated state injection** for client hydration
- **Error boundaries** with graceful fallbacks
- **Full HTML document** rendering from layout

### Client Entry (`src/entry.client.tsx`)
- **Hydration** with `hydrateRoot`
- **State rehydration** from server-rendered data
- **Query client setup** for client-side operations
- **Seamless transition** from server to client

### Layout Component (`src/app/+layout.tsx`)
- **Complete HTML document** structure
- **CSS-in-JS** styling for SSR compatibility
- **Navigation** and common UI elements
- **SSR mode indicator** badge

## Data Fetching Examples

### Server-Side Data Fetching
```typescript
// This query runs on the server during SSR
const { data, isLoading, error } = useQuery({
  queryKey: ['server-stats'],
  queryFn: fetchServerStats,
  staleTime: 5 * 60 * 1000, // 5 minutes
  // Disable background refetching on server
  refetchInterval: false,
});
```

### Client-Side Hydration
```typescript
// After hydration, queries can refetch in the background
const { data, isFetching, refetch } = useQuery({
  queryKey: ['dashboard'],
  queryFn: fetchDashboardData,
  staleTime: 2 * 60 * 1000,
  refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
});
```

### Mutations with Cache Invalidation
```typescript
const likeMutation = useMutation({
  mutationFn: likePost,
  onSuccess: (data, variables) => {
    // Invalidate related queries after successful mutation
    invalidateQueries(['posts', 'detail', variables.postId]);
    invalidateQueries(['posts', 'lists']);
  },
  retry: 1,
});
```

## Page Examples

### Home Page (`/`)
- **Server-rendered statistics** with real-time updates
- **Interactive counter** demonstrating client-side state
- **Background refetching** every 15 seconds after hydration
- **SSR benefits showcase** with performance metrics

### Posts Page (`/posts`)
- **Server-side data fetching** for instant content visibility
- **SEO-optimized** with full content in initial HTML
- **Client-side enhancements** after hydration
- **Error handling** with retry mechanisms

### Post Detail Page (`/posts/:id`)
- **Dynamic route parameters** in query keys
- **Server-rendered content** for SEO and social sharing
- **Client-side mutations** for likes and interactions
- **Optimistic updates** for better user experience

### Dashboard Page (`/dashboard`)
- **Real-time analytics** with server-side initial data
- **Auto-updating metrics** every 30 seconds
- **Complex data visualization** with server rendering
- **Interactive controls** enhanced after hydration

### About Page (`/about`)
- **Static content** with server-side rendering
- **Prefetching demonstrations** for performance
- **Framework comparison** tables
- **Interactive features** after hydration

## Configuration

### Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import { nitro } from 'nitro-js/vite';

export default defineConfig({
  plugins: [
    ...nitro({
      ssr: true, // Enable SSR mode
      handlerPath: 'src/entry.server.tsx'
    })
  ],
});
```

### Query Client Setup
```typescript
// Server-side (per request)
function createServerQueryClient() {
  return createQueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false, // Disable on server
      },
    },
  });
}

// Client-side (singleton)
const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
```

## SSR Benefits Demonstrated

### Performance
- **Faster Time to First Contentful Paint (FCP)**
- **Better Core Web Vitals** scores
- **Streaming rendering** for progressive content delivery
- **Reduced JavaScript bundle impact** on initial load

### SEO & Accessibility
- **Search engine crawlable** content
- **Social media rich previews** with meta tags
- **Screen reader accessible** content immediately
- **Progressive enhancement** for JavaScript-disabled users

### User Experience
- **Instant content visibility** without loading states
- **Seamless hydration** with preserved server state
- **Background updates** after initial render
- **Graceful error handling** with server-side fallbacks

## Development vs Production

### Development Mode
- **Hot module replacement** for fast development
- **Error boundaries** with detailed stack traces
- **Source maps** for debugging
- **Automatic restarts** on server changes

### Production Mode
- **Optimized bundles** with tree shaking
- **Compressed assets** and efficient caching
- **Error logging** and monitoring integration
- **Performance optimizations** for server rendering

## Deployment Considerations

### Server Requirements
- **Node.js runtime** for SSR execution
- **Memory management** for query client lifecycle
- **Caching strategies** for rendered content
- **Load balancing** for multiple server instances

### Edge Deployment
- **Edge runtime compatibility** with streaming
- **Regional data fetching** optimization
- **CDN integration** for static assets
- **Global performance** optimization

This SSR example showcases the full power of Nitro.js for building high-performance, SEO-friendly React applications with modern data fetching patterns.