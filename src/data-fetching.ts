import { useState, useEffect, useCallback, useRef, useContext, createContext, createElement, type ReactNode } from "react";
import { LRUCache } from "lru-cache";
import { defer } from "./batching";
import { useSignal, type Signal } from "./state";

/* ======================================================
   QUERY TYPES
====================================================== */

/** Query key can be string, array, or object for complex queries */
export type QueryKey = string | readonly unknown[];

/** Query function that fetches data */
export type QueryFunction<TData = unknown, TQueryKey extends QueryKey = QueryKey> = (
    context: QueryFunctionContext<TQueryKey>
) => Promise<TData>;

/** Context passed to query functions */
export interface QueryFunctionContext<TQueryKey extends QueryKey = QueryKey> {
    queryKey: TQueryKey;
    signal?: AbortSignal;
    meta?: QueryMeta;
}

/** Query metadata */
export interface QueryMeta {
    [key: string]: unknown;
}

/** Query status */
export type QueryStatus = 'pending' | 'error' | 'success';

/** Fetch status */
export type FetchStatus = 'fetching' | 'paused' | 'idle';

/** Query state */
export interface QueryState<TData = unknown, TError = Error> {
    data: TData | undefined;
    dataUpdatedAt: number;
    error: TError | null;
    errorUpdatedAt: number;
    failureCount: number;
    failureReason: TError | null;
    fetchStatus: FetchStatus;
    isInvalidated: boolean;
    status: QueryStatus;
}

/** Query options */
export interface QueryOptions<
    TQueryFnData = unknown,
    TError = Error,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
> {
    queryKey: TQueryKey;
    queryFn: QueryFunction<TQueryFnData, TQueryKey>;
    enabled?: boolean;
    retry?: number | boolean | ((failureCount: number, error: TError) => boolean);
    retryDelay?: number | ((retryAttempt: number, error: TError) => number);
    staleTime?: number;
    gcTime?: number;
    refetchInterval?: number | false;
    refetchIntervalInBackground?: boolean;
    refetchOnMount?: boolean | "always";
    refetchOnWindowFocus?: boolean | "always";
    refetchOnReconnect?: boolean | "always";
    select?: (data: TQueryFnData) => TData;
    placeholderData?: TData | ((previousData: TData | undefined) => TData);
    initialData?: TData | (() => TData);
    initialDataUpdatedAt?: number | (() => number);
    meta?: QueryMeta;
    networkMode?: "online" | "always" | "offlineFirst";
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    onSettled?: (data: TData | undefined, error: TError | null) => void;
    structuralSharing?: boolean | ((oldData: TData | undefined, newData: TData) => TData);
}

/** Use query result */
export interface UseQueryResult<TData = unknown, TError = Error> extends QueryState<TData, TError> {
    isLoading: boolean;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    isFetching: boolean;
    isPlaceholderData: boolean;
    isRefetching: boolean;
    isStale: boolean;
    refetch: (options?: { throwOnError?: boolean; cancelRefetch?: boolean }) => Promise<UseQueryResult<TData, TError>>;
}

/** Mutation options */
export interface MutationOptions<
    TData = unknown,
    TError = Error,
    TVariables = void,
    TContext = unknown
> {
    mutationFn: (variables: TVariables) => Promise<TData>;
    retry?: number | boolean | ((failureCount: number, error: TError) => boolean);
    retryDelay?: number | ((retryAttempt: number, error: TError) => number);
    onMutate?: (variables: TVariables) => Promise<TContext | void> | TContext | void;
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown;
    meta?: QueryMeta;
    networkMode?: "online" | "always" | "offlineFirst";
}

/** Mutation state */
export interface MutationState<TData = unknown, TError = Error, TVariables = void, TContext = unknown> {
    data: TData | undefined;
    error: TError | null;
    failureCount: number;
    failureReason: TError | null;
    isError: boolean;
    isIdle: boolean;
    isPending: boolean;
    isSuccess: boolean;
    status: "idle" | "pending" | "error" | "success";
    variables: TVariables | undefined;
    submittedAt: number;
    context: TContext | undefined;
}

/** Use mutation result */
export interface UseMutationResult<TData = unknown, TError = Error, TVariables = void, TContext = unknown>
    extends MutationState<TData, TError, TVariables, TContext> {
    mutate: (variables: TVariables, options?: MutateOptions<TData, TError, TVariables, TContext>) => void;
    mutateAsync: (variables: TVariables, options?: MutateOptions<TData, TError, TVariables, TContext>) => Promise<TData>;
    reset: () => void;
}

/** Mutate options */
export interface MutateOptions<TData = unknown, TError = Error, TVariables = void, TContext = unknown> {
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown;
}

/* ======================================================
   QUERY CLIENT
====================================================== */

/** Query cache entry */
interface QueryCacheEntry {
    state: QueryState<any, any>;
    observers: Set<QueryObserver>;
    promise: Promise<any> | null;
    abortController: AbortController | null;
    gcTimeout: NodeJS.Timeout | null;
    refetchInterval: NodeJS.Timeout | null;
}

/** Query observer for managing subscriptions */
class QueryObserver {
    constructor(
        public options: QueryOptions<any, any, any>,
        public callback: (result: UseQueryResult<any, any>) => void
    ) { }
}

/** Query client configuration */
export interface QueryClientConfig {
    defaultOptions?: {
        queries?: Partial<QueryOptions>;
        mutations?: Partial<MutationOptions>;
    };
    cache?: {
        maxSize?: number;
        ttl?: number;
    };
}

/** Main query client class */
export class QueryClient {
    private cache: LRUCache<string, QueryCacheEntry>;
    private defaultOptions: QueryClientConfig['defaultOptions'];

    constructor(config: QueryClientConfig = {}) {
        this.cache = new LRUCache({
            max: config.cache?.maxSize ?? 1000,
            ttl: config.cache?.ttl ?? 5 * 60 * 1000,
            dispose: (entry) => {
                this.cleanupQuery(entry);
            }
        });

        this.defaultOptions = config.defaultOptions ?? {};
    }

    private cleanupQuery(entry: QueryCacheEntry) {
        if (entry.abortController) {
            entry.abortController.abort();
        }
        if (entry.gcTimeout) {
            clearTimeout(entry.gcTimeout);
        }
        if (entry.refetchInterval) {
            clearInterval(entry.refetchInterval);
        }
    }

    private getQueryKey(queryKey: QueryKey): string {
        return JSON.stringify(queryKey);
    }

    private getQueryEntry(queryKey: QueryKey): QueryCacheEntry {
        const key = this.getQueryKey(queryKey);
        let entry = this.cache.get(key);

        if (!entry) {
            entry = {
                state: {
                    data: undefined,
                    dataUpdatedAt: 0,
                    error: null,
                    errorUpdatedAt: 0,
                    failureCount: 0,
                    failureReason: null,
                    fetchStatus: 'idle',
                    isInvalidated: false,
                    status: 'pending'
                },
                observers: new Set(),
                promise: null,
                abortController: null,
                gcTimeout: null,
                refetchInterval: null
            };
            this.cache.set(key, entry);
        }

        return entry;
    }

    private notifyObservers(entry: QueryCacheEntry) {
        entry.observers.forEach(observer => {
            const result = this.buildQueryResult(entry.state, observer.options);
            observer.callback(result);
        });
    }

    private buildQueryResult<TData, TError>(
        state: QueryState<TData, TError>,
        options: QueryOptions<any, TError, TData>
    ): UseQueryResult<TData, TError> {
        const { data, error, status, fetchStatus } = state;

        let transformedData = data;
        if (options.select && data !== undefined) {
            transformedData = options.select(data);
        }

        const isLoading = status === 'pending' && fetchStatus === 'fetching';
        const isPending = status === 'pending';
        const isSuccess = status === 'success';
        const isError = status === 'error';
        const isFetching = fetchStatus === 'fetching';
        const isStale = this.isStale(state as any, options as any);

        return {
            ...state,
            data: transformedData,
            isLoading,
            isPending,
            isSuccess,
            isError,
            isFetching,
            isPlaceholderData: false,
            isRefetching: isFetching && !isLoading,
            isStale,
            refetch: async (refetchOptions = {}) => {
                await this.fetchQuery(options);
                return this.buildQueryResult(state, options);
            }
        };
    }

    private isStale(state: QueryState, options: QueryOptions): boolean {
        const staleTime = options.staleTime ?? 0;
        return Date.now() - state.dataUpdatedAt > staleTime;
    }

    async fetchQuery<TData, TError>(
        options: QueryOptions<any, TError, TData>
    ): Promise<TData> {
        const entry = this.getQueryEntry(options.queryKey);

        if (entry.abortController) {
            entry.abortController.abort();
        }

        entry.abortController = new AbortController();
        entry.state.fetchStatus = 'fetching';
        this.notifyObservers(entry);

        const context: QueryFunctionContext = {
            queryKey: options.queryKey,
            signal: entry.abortController.signal,
            meta: options.meta
        };

        try {
            const data = await this.executeWithRetry(
                () => options.queryFn(context),
                options.retry ?? 3,
                options.retryDelay,
                entry.abortController.signal
            );

            entry.state = {
                ...entry.state,
                data,
                dataUpdatedAt: Date.now(),
                error: null,
                errorUpdatedAt: 0,
                failureCount: 0,
                failureReason: null,
                fetchStatus: 'idle',
                status: 'success'
            };

            if (options.refetchInterval && options.refetchInterval > 0) {
                entry.refetchInterval = setInterval(() => {
                    this.fetchQuery(options);
                }, options.refetchInterval);
            }

            const gcTime = options.gcTime ?? 5 * 60 * 1000;
            if (gcTime > 0) {
                entry.gcTimeout = setTimeout(() => {
                    if (entry.observers.size === 0) {
                        this.cache.delete(this.getQueryKey(options.queryKey));
                    }
                }, gcTime);
            }

            this.notifyObservers(entry);

            if (options.onSuccess) {
                defer(() => options.onSuccess!(data));
            }

            return data;

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return entry.state.data as TData;
            }

            const err = error as TError;
            entry.state = {
                ...entry.state,
                error: err,
                errorUpdatedAt: Date.now(),
                failureCount: entry.state.failureCount + 1,
                failureReason: err,
                fetchStatus: 'idle',
                status: 'error'
            };

            this.notifyObservers(entry);

            if (options.onError) {
                defer(() => options.onError!(err));
            }

            throw error;
        } finally {
            if (options.onSettled) {
                defer(() => options.onSettled!(entry.state.data, entry.state.error));
            }
        }
    }

    private async executeWithRetry<T>(
        fn: () => Promise<T>,
        retry: number | boolean | ((failureCount: number, error: any) => boolean),
        retryDelay?: number | ((retryAttempt: number, error: any) => number),
        signal?: AbortSignal
    ): Promise<T> {
        let attempt = 0;
        let lastError: any;

        while (true) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (signal?.aborted) {
                    throw error;
                }

                const shouldRetry = typeof retry === 'function'
                    ? retry(attempt, error)
                    : typeof retry === 'boolean'
                        ? retry && attempt < 3
                        : attempt < retry;

                if (!shouldRetry) {
                    throw error;
                }

                const delay = typeof retryDelay === 'function'
                    ? retryDelay(attempt, error)
                    : retryDelay ?? Math.min(1000 * Math.pow(2, attempt), 30000);

                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }
        }
    }

    subscribeToQuery<TData, TError>(
        options: QueryOptions<any, TError, TData>,
        callback: (result: UseQueryResult<TData, TError>) => void
    ): () => void {
        const entry = this.getQueryEntry(options.queryKey);
        const observer = new QueryObserver(options as any, callback as any);

        entry.observers.add(observer);

        if (entry.gcTimeout) {
            clearTimeout(entry.gcTimeout);
            entry.gcTimeout = null;
        }

        if (options.enabled !== false && entry.state.status === 'pending') {
            this.fetchQuery(options);
        }

        return () => {
            entry.observers.delete(observer);

            if (entry.observers.size === 0) {
                const gcTime = options.gcTime ?? 5 * 60 * 1000;
                if (gcTime > 0) {
                    entry.gcTimeout = setTimeout(() => {
                        this.cache.delete(this.getQueryKey(options.queryKey));
                    }, gcTime);
                }
            }
        };
    }

    invalidateQueries(queryKey?: QueryKey): void {
        if (queryKey) {
            const key = this.getQueryKey(queryKey);
            const entry = this.cache.get(key);
            if (entry) {
                entry.state.isInvalidated = true;
                this.notifyObservers(entry);
            }
        } else {
            for (const entry of this.cache.values()) {
                entry.state.isInvalidated = true;
                this.notifyObservers(entry);
            }
        }
    }

    setQueryData<TData>(queryKey: QueryKey, data: TData): void {
        const entry = this.getQueryEntry(queryKey);
        entry.state = {
            ...entry.state,
            data,
            dataUpdatedAt: Date.now(),
            status: 'success'
        };
        this.notifyObservers(entry);
    }

    getQueryData<TData>(queryKey: QueryKey): TData | undefined {
        const entry = this.cache.get(this.getQueryKey(queryKey));
        return entry?.state.data;
    }

    removeQueries(queryKey?: QueryKey): void {
        if (queryKey) {
            const key = this.getQueryKey(queryKey);
            const entry = this.cache.get(key);
            if (entry) {
                this.cleanupQuery(entry);
                this.cache.delete(key);
            }
        } else {
            this.cache.clear();
        }
    }

    clear(): void {
        this.cache.clear();
    }
}

/* ======================================================
   REACT CONTEXT & PROVIDER
====================================================== */

const QueryClientContext = createContext<QueryClient | undefined>(undefined);

export interface QueryClientProviderProps {
    client: QueryClient;
    children: ReactNode;
}

export function QueryClientProvider({ client, children }: QueryClientProviderProps) {
    return createElement(
        QueryClientContext.Provider,
        { value: client },
        children
    );
}

export function useQueryClient(): QueryClient {
    const client = useContext(QueryClientContext);
    if (!client) {
        throw new Error('useQueryClient must be used within a QueryClientProvider');
    }
    return client;
}

/* ======================================================
   REACT HOOKS
====================================================== */

/**
 * Primary hook for data fetching with TanStack Query-like API
 */
export function useQuery<
    TQueryFnData = unknown,
    TError = Error,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
>(
    options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
    const client = useQueryClient();
    const [result, setResult] = useState<UseQueryResult<TData, TError>>(() => {
        const entry = client['getQueryEntry'](options.queryKey);
        return client['buildQueryResult'](entry.state, options as any) as any;
    });

    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        const unsubscribe = client.subscribeToQuery(
            optionsRef.current as any,
            (newResult) => {
                setResult(newResult as any);
            }
        );

        return unsubscribe;
    }, [client, JSON.stringify(options.queryKey)]);

    return result;
}

/**
 * Simplified useQuery hook with just queryKey and queryFn
 */
export function useSimpleQuery<TData = unknown, TError = Error>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: Partial<Omit<QueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>>
): UseQueryResult<TData, TError> {
    return useQuery({
        queryKey,
        queryFn: queryFn as any,
        ...options
    } as any);
}

/**
 * Hook for mutations with TanStack Query-like API
 */
export function useMutation<
    TData = unknown,
    TError = Error,
    TVariables = void,
    TContext = unknown
>(
    options: MutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
    const [state, setState] = useState<MutationState<TData, TError, TVariables, TContext>>({
        data: undefined,
        error: null,
        failureCount: 0,
        failureReason: null,
        isError: false,
        isIdle: true,
        isPending: false,
        isSuccess: false,
        status: "idle",
        variables: undefined,
        submittedAt: 0,
        context: undefined
    });

    const isMountedRef = useRef(true);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const executeMutation = useCallback(async (
        variables: TVariables,
        mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>
    ): Promise<TData> => {
        if (!isMountedRef.current) {
            throw new Error('Component unmounted');
        }

        const currentOptions = optionsRef.current;
        let context: TContext | undefined;

        if (currentOptions.onMutate) {
            context = await currentOptions.onMutate(variables) as TContext;
        }

        setState(prev => ({
            ...prev,
            isPending: true,
            isIdle: false,
            status: "pending",
            variables,
            submittedAt: Date.now(),
            context
        }));

        try {
            const data = await executeWithRetry(
                () => currentOptions.mutationFn(variables),
                currentOptions.retry ?? false,
                currentOptions.retryDelay
            );

            if (isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    data,
                    error: null,
                    failureCount: 0,
                    failureReason: null,
                    isError: false,
                    isPending: false,
                    isSuccess: true,
                    status: "success"
                }));
            }

            defer(async () => {
                if (currentOptions.onSuccess) {
                    await currentOptions.onSuccess(data, variables, context);
                }
                if (mutateOptions?.onSuccess) {
                    await mutateOptions.onSuccess(data, variables, context);
                }
                if (currentOptions.onSettled) {
                    await currentOptions.onSettled(data, null, variables, context);
                }
                if (mutateOptions?.onSettled) {
                    await mutateOptions.onSettled(data, null, variables, context);
                }
            });

            return data;

        } catch (error) {
            const err = error as TError;

            if (isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    error: err,
                    failureCount: prev.failureCount + 1,
                    failureReason: err,
                    isError: true,
                    isPending: false,
                    isSuccess: false,
                    status: "error"
                }));
            }

            defer(async () => {
                if (currentOptions.onError) {
                    await currentOptions.onError(err, variables, context);
                }
                if (mutateOptions?.onError) {
                    await mutateOptions.onError(err, variables, context);
                }
                if (currentOptions.onSettled) {
                    await currentOptions.onSettled(undefined, err, variables, context);
                }
                if (mutateOptions?.onSettled) {
                    await mutateOptions.onSettled(undefined, err, variables, context);
                }
            });

            throw error;
        }
    }, []);

    const mutate = useCallback((
        variables: TVariables,
        options?: MutateOptions<TData, TError, TVariables, TContext>
    ) => {
        executeMutation(variables, options).catch(() => {
            // Swallow errors for fire-and-forget mutate
        });
    }, [executeMutation]);

    const mutateAsync = useCallback((
        variables: TVariables,
        options?: MutateOptions<TData, TError, TVariables, TContext>
    ) => {
        return executeMutation(variables, options);
    }, [executeMutation]);

    const reset = useCallback(() => {
        setState({
            data: undefined,
            error: null,
            failureCount: 0,
            failureReason: null,
            isError: false,
            isIdle: true,
            isPending: false,
            isSuccess: false,
            status: "idle",
            variables: undefined,
            submittedAt: 0,
            context: undefined
        });
    }, []);

    return {
        ...state,
        mutate,
        mutateAsync,
        reset
    };
}

export type QuerySignal<TData = unknown, TError = Error> = [Signal<TData | undefined>, Omit<UseQueryResult<TData, TError>, 'data'>];

/**
 * Signal-based query hook
 */
export function useQuerySignal<TData = unknown, TError = Error>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: Partial<Omit<QueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>>
): QuerySignal<TData, TError> {
    const queryResult = useSimpleQuery(queryKey, queryFn, options);
    const dataSignal = useSignal<TData | undefined>(queryResult.data);

    useEffect(() => {
        dataSignal(queryResult.data);
    }, [queryResult.data, dataSignal]);

    const { data, ...restResult } = queryResult;
    return [dataSignal, restResult];
}

/* ======================================================
   UTILITY HOOKS
====================================================== */

export interface Invalidator {
    (queryKey?: QueryKey): void;
}

export function useInvalidateQueries(): Invalidator {
    const client = useQueryClient();
    return useCallback((queryKey?: QueryKey) => {
        client.invalidateQueries(queryKey);
    }, [client]);
}

export interface PrefetchQuery {
    <TData>(
        queryKey: QueryKey,
        queryFn: QueryFunction<TData>,
        options?: Partial<QueryOptions<TData>>
    ): Promise<TData>;
}

export function usePrefetchQuery(): PrefetchQuery {
    const client = useQueryClient();
    return useCallback(<TData>(
        queryKey: QueryKey,
        queryFn: QueryFunction<TData>,
        options?: Partial<QueryOptions<TData>>
    ) => {
        return client.fetchQuery({
            queryKey,
            queryFn,
            ...options
        });
    }, [client]);
}

export interface SetQueryData {
    <TData>(queryKey: QueryKey, data: TData): void;
}

export function useSetQueryData(): SetQueryData {
    const client = useQueryClient();
    return useCallback(<TData>(queryKey: QueryKey, data: TData) => {
        client.setQueryData(queryKey, data);
    }, [client]);
}

/* ======================================================
   HELPER FUNCTIONS
====================================================== */

export interface RetryFunction {
    (failureCount: number, error: any): boolean;
}

export interface RetryDelayFunction {
    (retryAttempt: number, error: any): number;
}

async function executeWithRetry<T>(
    fn: () => Promise<T>,
    retry: number | boolean | RetryFunction,
    retryDelay?: number | ((retryAttempt: number, error: any) => number)
): Promise<T> {
    let attempt = 0;
    let lastError: any;

    while (true) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            const shouldRetry = typeof retry === 'function'
                ? retry(attempt, lastError)
                : typeof retry === 'boolean'
                    ? retry && attempt < 3
                    : attempt < retry;

            if (!shouldRetry) {
                throw lastError;
            }

            const delay = typeof retryDelay === 'function'
                ? retryDelay(attempt, error)
                : retryDelay ?? Math.min(1000 * Math.pow(2, attempt), 30000);

            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
        }
    }
}

/* ======================================================
   CONVENIENCE FUNCTIONS
====================================================== */

export function createQueryClient(config?: QueryClientConfig): QueryClient {
    return new QueryClient(config);
}

export function createRestQueryFn<TData = unknown>(
    baseUrl: string,
    defaultOptions?: RequestInit
): QueryFunction<TData> {
    return async ({ queryKey, signal }) => {
        const [, ...pathSegments] = queryKey as [string, ...string[]];
        const url = `${baseUrl}/${pathSegments.join('/')}`;

        const response = await fetch(url, {
            ...defaultOptions,
            signal,
            headers: {
                'Content-Type': 'application/json',
                ...defaultOptions?.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    };
}

export function createRestMutationFn<TData = unknown, TVariables = unknown>(
    url: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
    defaultOptions?: RequestInit
) {
    return async (variables: TVariables): Promise<TData> => {
        const response = await fetch(url, {
            method,
            ...defaultOptions,
            headers: {
                'Content-Type': 'application/json',
                ...defaultOptions?.headers
            },
            body: variables ? JSON.stringify(variables) : undefined
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    };
}


export interface QueryKeyManager<T extends string> {
    all: readonly [T];
    lists: () => readonly [T, "list"];
    list: (filters: Record<string, unknown>) => readonly [T, "list", Record<string, unknown>];
    details: () => readonly [T, "detail"];
    detail: (id: string | number) => readonly [T, "detail", string | number];
    infinite: (filters: Record<string, unknown>) => readonly [T, "infinite", Record<string, unknown>];
}

export const queryKeys: QueryKeyManager<string> = {
    all: ['queries'] as const,
    lists: () => [...queryKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.lists(), filters] as const,
    details: () => [...queryKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.details(), id] as const,
    infinite: (filters: Record<string, unknown>) => [...queryKeys.all, 'infinite', filters] as const,
};

export function createQueryKeys<T extends string>(resource: T): QueryKeyManager<T> {
    return {
        all: [resource] as const,
        lists: () => [resource, 'list'] as const,
        list: (filters: Record<string, unknown>) => [resource, 'list', filters] as const,
        details: () => [resource, 'detail'] as const,
        detail: (id: string | number) => [resource, 'detail', id] as const,
        infinite: (filters: Record<string, unknown>) => [resource, 'infinite', filters] as const,
    };
}