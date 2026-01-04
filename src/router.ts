import path from "node:path";
import { pathToFileURL } from "node:url";
import { globSync } from "node:fs";
import { AsyncLocalStorage } from "node:async_hooks";
import { StrictMode, useState, useEffect, createElement } from "react";
import { RouterProvider } from "react-router/dom";
import {
  createBrowserRouter,
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
  type RouteObject,
  type StaticHandlerContext,
  type DataRouter as Router$1,
  type DOMRouterOpts,
  type Params
} from "react-router";
export * from "react-router";

// --- 1. Async Context ---
export const requestStorage = new AsyncLocalStorage<NitroRequest>();
export const useNitroRequest = () => requestStorage.getStore();

// --- 2. Custom Request ---
export interface NitroRequestInit extends RequestInit {
  params?: Params<string>;
  duplex?: "half" | "full";
}

export class NitroRequest<T = {}> extends Request {
  public readonly params: Params<string>;
  constructor(input: string | URL | Request, init?: NitroRequestInit) {
    super(input, init);
    this.params = init?.params ?? {};
  }

  override json() {
    return super.json() as Promise<T>;
  } 
}

// --- 4. Convention-Based Route Generation ---
export function generateRoutes(): RouteObject[] {
  const appDir = path.join(process.cwd(), "src/app");
  // Supports both +route and +layout in JS/TS
  const files = globSync("**/+{route,layout}.{tsx,ts,jsx,js}", { cwd: appDir });
  const routeMap = new Map<string, RouteObject>();

  files.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length).forEach(file => {
    const normalized = file.replace(/\\/g, "/");
    const dirKey = path.dirname(normalized) === "." ? "" : path.dirname(normalized);
    const fileName = path.basename(normalized);
    
    // Grouping logic (SvelteKit style)
    const pathSegments = dirKey.split("/").filter(s => s && !s.startsWith("("));
    const segmentName = pathSegments[pathSegments.length - 1] ?? "";
    const routePath = segmentName.replace(/\$(\w+)/g, ":$1").replace(/\$\$(\w+)/g, "*");

    if (!routeMap.has(dirKey)) {
      routeMap.set(dirKey, { 
        path: routePath || (dirKey === "" ? "/" : undefined), 
        children: [] 
      });
    }

    const current = routeMap.get(dirKey)!;
    const lazy = async () => {
      const mod = await import(pathToFileURL(path.join(appDir, file)).href);
      return { 
        Component: mod.default, 
        loader: mod.loader, 
        action: mod.action, 
        ErrorBoundary: mod.ErrorBoundary 
      };
    };

    if (fileName.startsWith("+layout")) {
        current.lazy = lazy;
        current.id = `layout:${dirKey || 'root'}`;
    } else {
        current.children!.push({ index: true, lazy, id: `route:${normalized}` });
    }
  });

  const rootRoutes: RouteObject[] = [];
  const entries = Array.from(routeMap.entries()).sort((a, b) => b.length - a.length);

  for (const [dir, route] of entries) {
    if (dir === "") { rootRoutes.push(route); continue; }
    const parentDir = path.dirname(dir) === "." ? "" : path.dirname(dir);
    const parent = routeMap.get(parentDir);
    if (parent) parent.children!.push(route);
    else rootRoutes.push(route);
  }
  return rootRoutes;
}

// --- 5. Framework Components ---
export interface NitroBrowserProps extends DOMRouterOpts {
  manualRoutes?: RouteObject[];
  strictMode?: boolean;
  /** Enable native browser view transitions on navigation */
  viewTransitions?: boolean;
}

export function NitroBrowser({ manualRoutes, strictMode, viewTransitions = true, ...opts }: NitroBrowserProps) {
  const [router, setRouter] = useState<Router$1 | null>(null);

  useEffect(() => {
    const routes = manualRoutes || generateRoutes();
    setRouter(createBrowserRouter(routes, { 
      ...opts, 
      window,
      // 2025 Standard: Enable native view transitions
      future: {
        v7_relativeSplatPath: true,
        // This tells React Router to use document.startViewTransition
        v7_viewTransition: viewTransitions 
      }
    }));
  }, [manualRoutes]);

  if (!router) return null;
  const content = createElement(RouterProvider, { router });
  return strictMode ? createElement(StrictMode, null, content) : content;
}

export interface NitroServerProps {
  context: StaticHandlerContext;
  manualRoutes?: RouteObject[];
  strictMode?: boolean;
}

export function NitroServer({ context, manualRoutes, strictMode }: NitroServerProps) {
  const routes = manualRoutes || generateRoutes();
  const router = createStaticRouter(routes, context);
  const content = createElement(StaticRouterProvider, { router, context, hydrate: true });
  return strictMode ? createElement(StrictMode, null, content) : content;
}

export const createNitroHandler = (manualRoutes?: RouteObject[]) => {
  const routes = manualRoutes || generateRoutes();
  const handler = createStaticHandler(routes);
  return async (req: Request) => await handler.query(req);
};
