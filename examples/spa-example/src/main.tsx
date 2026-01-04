import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NitroBrowser } from 'nitro-js/router';
import { QueryClientProvider, createQueryClient } from 'nitro-js/query';

// Create query client with configuration
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

// Get the root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create root and render the app
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NitroBrowser 
        strictMode={false} // Already wrapped in StrictMode above
        viewTransitions={true}
      />
    </QueryClientProvider>
  </StrictMode>
);