# Nitro.js SPA Example

This example demonstrates how to use Nitro.js in SPA (Single Page Application) mode with advanced data fetching capabilities.

## Features

- ✅ File-based routing with `+route.tsx` and `+layout.tsx`
- ✅ Client-side navigation with React Router
- ✅ React 18 with `createRoot()`
- ✅ TypeScript support
- ✅ Hot module replacement
- ✅ Dynamic routes with parameters
- ✅ **TanStack Query-like data fetching**
- ✅ **Automatic caching with LRU cache**
- ✅ **Background refetching and stale-while-revalidate**
- ✅ **Optimistic updates and mutations**
- ✅ **Signal-based reactive queries**
- ✅ **Request deduplication and retry logic**

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

## Project Structure

```
src/
├── main.tsx              # SPA entry point with createRoot() and QueryClientProvider
└── app/                  # File-based routes
    ├── +layout.tsx       # Root layout
    ├── +route.tsx        # Home page (/) - Signal-based queries demo
    ├── about/
    │   └── +route.tsx    # About page (/about) - Prefetching and cache updates
    └── posts/
        ├── +route.tsx    # Posts list (/posts) - useQuery with caching
        └── $id/
            └── +route.tsx # Post detail (/posts/:id) - Mutations and optimistic updates
```

## Data Fetching Examples

### Basic Query with Caching
```typescript
import { useQuery, createQueryKeys } from 'nitro-js/query';

const postKeys = createQueryKeys('posts');

const { data, isLoading, error, refetch } = useQuery({
  queryKey: postKeys.lists(),
  queryFn: fetchPosts,
  staleTime: 2 * 60 * 1000, // 2 minutes
  refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
});
```

### Signal-based Reactive Queries
```typescript
import { useQuerySignal } from 'nitro-js/query';

const [statsSignal, { isLoading, refetch }] = useQuerySignal(
  ['stats'],
  fetchStats,
  { staleTime: 30 * 1000 }
);

// Use signal reactively
const stats = statsSignal();
```

### Mutations with Optimistic Updates
```typescript
import { useMutation, useInvalidateQueries } from 'nitro-js/query';

const invalidateQueries = useInvalidateQueries();

const likeMutation = useMutation({
  mutationFn: likePost,
  onMutate: async ({ postId }) => {
    // Optimistic update
    // Update UI immediately before request completes
  },
  onSuccess: (data, variables) => {
    // Invalidate related queries to refetch fresh data
    invalidateQueries(postKeys.detail(variables.postId));
  },
  retry: 2,
});
```

### Advanced Features
```typescript
import { usePrefetchQuery, useSetQueryData } from 'nitro-js/query';

const prefetchQuery = usePrefetchQuery();
const setQueryData = useSetQueryData();

// Prefetch data for instant navigation
await prefetchQuery(['posts'], fetchPosts);

// Manually update cache
setQueryData(['stats'], newStatsData);
```

## Configuration

The key difference from SSR mode is in `vite.config.ts`:

```typescript
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
```

And setting up the QueryClient in `src/main.tsx`:

```typescript
import { QueryClientProvider, createQueryClient } from 'nitro-js/query';

const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
  cache: {
    maxSize: 100,
    ttl: 15 * 60 * 1000, // 15 minutes
  },
});

root.render(
  <QueryClientProvider client={queryClient}>
    <NitroBrowser />
  </QueryClientProvider>
);
```

## Data Fetching Features Demonstrated

### Home Page (`/`)
- **Signal-based queries** for reactive state
- **Background refetching** every 10 seconds
- **Mutations** that invalidate and update related queries
- **Real-time statistics** with auto-updating UI

### Posts Page (`/posts`)
- **Query with caching** and stale-while-revalidate
- **Loading states** with spinners and error handling
- **Manual refetch** with loading indicators
- **Background updates** every 5 minutes

### Post Detail Page (`/posts/:id`)
- **Dynamic route parameters** in query keys
- **Mutations with optimistic updates** for likes
- **Error handling and retry** logic
- **Cache invalidation** after successful mutations

### About Page (`/about`)
- **Prefetching** for instant navigation
- **Manual cache updates** with `setQueryData`
- **Stale data indicators** and refresh controls

## SPA vs SSR

This example runs in SPA mode, which means:

- All routing happens client-side
- Initial HTML is minimal, React takes over on load
- Better for interactive applications
- Simpler deployment (can be hosted statically)
- Slower initial page load compared to SSR
- **Data fetching works seamlessly** with client-side caching

To switch to SSR mode, change `ssr: false` to `ssr: true` and create a server entry point. The data fetching code remains exactly the same!