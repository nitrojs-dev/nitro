import { hydrateRoot } from 'react-dom/client';
import { NitroBrowser } from 'nitro-js/router';
import { QueryClientProvider, createQueryClient } from 'nitro-js/data-fetching';

// Create query client for client-side
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

// Hydrate dehydrated state if available
const dehydratedState = (window as any).__NITRO_DEHYDRATED_STATE__;
if (dehydratedState?.queries) {
  // In a real app, you'd rehydrate the query cache here
  console.log('Rehydrating query cache:', dehydratedState);
}

// Get the root element
const rootElement = document;

// Hydrate the app
hydrateRoot(
  rootElement,
  <QueryClientProvider client={queryClient}>
    <NitroBrowser 
      strictMode={true}
      viewTransitions={true}
    />
  </QueryClientProvider>
);