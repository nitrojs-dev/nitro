import { renderToReadableStream } from 'react-dom/server';
import { NitroServer, createNitroHandler, type NitroRequest } from 'nitro-js/router';
import { QueryClientProvider, createQueryClient } from 'nitro-js/data-fetching';

// Create a new query client for each request to avoid data leaking between requests
function createServerQueryClient() {
  return createQueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes
        retry: 3,
        refetchOnWindowFocus: false,
        // Disable refetching on server
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
      },
    },
    cache: {
      maxSize: 100,
      ttl: 15 * 60 * 1000, // 15 minutes
    },
  });
}

// Server-side handler with streaming
export default async function handler(request: NitroRequest): Promise<Response> {
  try {
    // Create query client for this request
    const queryClient = createServerQueryClient();
    
    // Create Nitro handler for routing
    const nitroHandler = createNitroHandler();
    const context = await nitroHandler(request);

    // Get the dehydrated state for client hydration
    const dehydratedState = JSON.stringify({
      queries: [], // In a real app, you'd serialize the query cache here
    });

    // Create the React app stream (includes full HTML document from layout)
    const stream = await renderToReadableStream(
      <QueryClientProvider client={queryClient}>
        <NitroServer context={context} strictMode={false} />
      </QueryClientProvider>,
      {
        bootstrapScripts: ['/src/entry.client.tsx'],
        onError(error) {
          console.error('SSR Streaming Error:', error);
        }
      }
    );

    // Wait for the stream to be ready
    await stream.allReady;

    // Transform the stream to inject our dehydrated state
    const transformedStream = new ReadableStream({
      start(controller) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              // Inject the dehydrated state before closing
              if (buffer.includes('</body>')) {
                buffer = buffer.replace(
                  '</body>',
                  `  <script>
                    window.__NITRO_DEHYDRATED_STATE__ = ${dehydratedState};
                  </script>
                </body>`
                );
              }
              if (buffer) {
                controller.enqueue(new TextEncoder().encode(buffer));
              }
              controller.close();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Check if we have a complete chunk to send
            const lastCompleteTag = Math.max(
              buffer.lastIndexOf('>'),
              buffer.lastIndexOf('</'),
              buffer.lastIndexOf('/>')
            );

            if (lastCompleteTag > -1) {
              const toSend = buffer.substring(0, lastCompleteTag + 1);
              buffer = buffer.substring(lastCompleteTag + 1);
              
              if (toSend) {
                controller.enqueue(new TextEncoder().encode(toSend));
              }
            }

            return pump();
          });
        }

        return pump();
      }
    });

    return new Response(transformedStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('SSR Error:', error);
    
    // Return error page as stream
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - Nitro.js</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            margin: 0;
            padding: 2rem;
            background: #f5f5f5;
        }
        .error-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .error-title {
            color: #dc3545;
            margin-bottom: 1rem;
        }
        .error-details {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            overflow: auto;
            font-family: monospace;
            font-size: 0.9rem;
            border-left: 4px solid #dc3545;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-title">Server Error</h1>
        <p>An error occurred while rendering the page on the server.</p>
        <div class="error-details">${error instanceof Error ? error.stack : String(error)}</div>
        <p style="margin-top: 2rem; color: #666; font-size: 0.9rem;">
            This error occurred during server-side rendering. In production, you would typically show a more user-friendly error page.
        </p>
    </div>
</body>
</html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }
}