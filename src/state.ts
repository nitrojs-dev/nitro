import { useState, useCallback, type SetStateAction } from "react";

/* ======================================================
   SIGNAL TYPES
====================================================== */

export type StateInput<T> = T | (() => T);

export interface Signal<T> {
    (): T;
    (value: SetStateAction<T>): T;
}

/* ======================================================
   useSignal (component-local)
====================================================== */

/**
 * React-local signal.
 * Callable getter/setter with React state semantics.
 */
export function useSignal<T>(input: StateInput<T>): Signal<T> {
    const [state, setState] = useState<T>(input);

    const signal = useCallback(
        (...args: Parameters<Signal<T>>): T => {
            // @ts-ignore: There's a version with no params!
            if (args.length === 0) {
                return state;
            }

            const next = args[0];
            setState(next);
            return typeof next === "function"
                ? (next as (prev: T) => T)(state)
                : next;
        },
        [state]
    );

    return signal as Signal<T>;
}