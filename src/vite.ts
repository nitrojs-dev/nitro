import type { Plugin, UserConfig } from "vite";
import path from "node:path";
import react, { type Options } from "@vitejs/plugin-react";
import { NitroRequest } from "./router";

/** Nitro.js plugin options */
export interface NitroOptions {
    /** Custom path to server entry (default: /src/entry.server.tsx) */
    handlerPath?: string;
    /** Custom path to client entry for SPA mode (default: /src/entry.client.tsx) */
    clientEntry?: string;
    /** React plugin config. */
    reactPlugin?: Options;
    /** Allows usage of the React compiler. */
    reactCompiler?: boolean;
    /** Whether to enable SSR (true) or use SPA mode (false). Default: true */
    ssr?: boolean;
}

/** 
 * The Nitro.js Vite plugin.
 * Provides file-based routing, SSR, and optimized React compilation.
 */
export function nitro(opts: NitroOptions = {}): Plugin[] {
    const ssr = opts.ssr ?? true;
    const HANDLER_PATH: string = opts.handlerPath?.replace(/^\.?\//, "") || (ssr ? "src/entry.server.tsx" : "");
    const CLIENT_ENTRY: string = opts.clientEntry?.replace(/^\.?\//, "") || "src/entry.client.tsx";
    const reactPluginOptions = opts.reactPlugin ?? {};

    return [
        // 1. React OXC/Babel Plugin
        ...react(reactPluginOptions),

        // 2. Development Server Configuration
        {
            name: "nitro/dev-config",
            config(config, { command }): UserConfig {
                const baseConfig = {
                    ...config,
                    appType: "custom" as const,
                    optimizeDeps: {
                        ...config.optimizeDeps,
                        include: [
                            ...(config.optimizeDeps?.include ?? []),
                            "react",
                            "react-dom",
                            "react-router"
                        ]
                    }
                };

                if (command === "build") {
                    if (ssr) {
                        // SSR build configuration
                        return {
                            ...baseConfig,
                            build: {
                                ...config.build,
                                ssr: true,
                                rollupOptions: {
                                    ...config.build?.rollupOptions,
                                    input: path.resolve(process.cwd(), HANDLER_PATH),
                                    external: [
                                        "react",
                                        "react-dom",
                                        "react-router"
                                    ]
                                },
                            },
                        };
                    } else {
                        // SPA build configuration
                        return {
                            ...baseConfig,
                            build: {
                                ...config.build,
                                rollupOptions: {
                                    ...config.build?.rollupOptions,
                                    input: {
                                        main: path.resolve(process.cwd(), CLIENT_ENTRY)
                                    }
                                },
                            },
                        };
                    }
                }

                return baseConfig;
            },
        },

        // 3. Development Server Middleware
        ssr ? ({
            name: "nitro/dev-server",
            enforce: "post",
            apply: "serve",
            configureServer(server) {
                return () => {
                    server.middlewares.use(async (req, res, next) => {
                        // Skip API routes and static assets
                        if (req.url?.startsWith('/api') ||
                            req.url?.includes('.') ||
                            req.url?.startsWith('/@') ||
                            req.url?.startsWith('/src/')) {
                            return next();
                        }

                        try {
                            // Load the server entry module
                            const entryPath = path.join(server.config.root, HANDLER_PATH);
                            const entry = await server.ssrLoadModule(entryPath, {
                                fixStacktrace: true
                            });

                            if (!entry.default || typeof entry.default !== "function") {
                                console.warn(`[Nitro.js] ${HANDLER_PATH} must export a default handler function.`);
                                return next();
                            }

                            // Create Nitro request
                            const url = new URL(req.url || '/', `http://${req.headers.host}`);
                            const nitroRequest = new NitroRequest(url.href, {
                                method: req.method as any,
                                headers: req.headers as Record<string, string>,
                            });

                            // Execute the handler
                            const response = await entry.default(nitroRequest);

                            if (response instanceof Response) {
                                // Handle Response object
                                res.statusCode = response.status;

                                // Set headers
                                response.headers.forEach((value, key) => {
                                    res.setHeader(key, value);
                                });

                                // Send body
                                const body = await response.text();
                                res.end(body);
                            } else {
                                // Fallback for other response types
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'text/html');
                                res.end(String(response));
                            }

                        } catch (error) {
                            console.error('[Nitro.js] SSR Error:', error);

                            // Fix stack trace for better debugging
                            if (error instanceof Error) {
                                server.ssrFixStacktrace(error);
                            }

                            // Send error response
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'text/html');
                            res.end(`
                                <!DOCTYPE html>
                                <html>
                                <head><title>Nitro.js Error</title></head>
                                <body>
                                    <h1>Development Error</h1>
                                    <pre>${error instanceof Error ? error.stack : String(error)}</pre>
                                </body>
                                </html>
                            `);
                        }
                    });
                };
            },
        }) : ({
            name: "nitro/spa-mode",
            enforce: "post",
            apply: "serve",
            configureServer(server) {
                return () => {
                    server.middlewares.use(async (req, res, next) => {
                        // Skip API routes and static assets
                        if (req.url?.startsWith('/api') ||
                            req.url?.includes('.') ||
                            req.url?.startsWith('/@') ||
                            req.url?.startsWith('/src/')) {
                            return next();
                        }

                        try {
                            // For SPA mode, serve the main HTML with client entry
                            const clientEntryPath = path.join(server.config.root, CLIENT_ENTRY);
                            
                            // Generate HTML template for SPA
                            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nitro.js App</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/${CLIENT_ENTRY}"></script>
</body>
</html>`;

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'text/html');
                            
                            // Transform the HTML through Vite for HMR and module resolution
                            const transformedHtml = await server.transformIndexHtml(req.url || '/', html);
                            res.end(transformedHtml);

                        } catch (error) {
                            console.error('[Nitro.js] SPA Error:', error);

                            // Fix stack trace for better debugging
                            if (error instanceof Error) {
                                server.ssrFixStacktrace(error);
                            }

                            // Send error response
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'text/html');
                            res.end(`
                                <!DOCTYPE html>
                                <html>
                                <head><title>Nitro.js Error</title></head>
                                <body>
                                    <h1>Development Error</h1>
                                    <pre>${error instanceof Error ? error.stack : String(error)}</pre>
                                </body>
                                </html>
                            `);
                        }
                    });
                };
            },
        }),

        // 4. File-based routing helper (development)
        {
            name: "nitro/routing",
            configureServer(server) {
                // Add any routing-specific development helpers here
                server.ws.on('nitro:route-update', () => {
                    // Handle route updates in development
                    server.ws.send('full-reload');
                });
            }
        }
    ];
}