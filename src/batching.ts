import { AsyncLocalStorage } from "node:async_hooks";

const queue = new Set<DeferFunctionInput>();
let isPending = false;

export interface DeferFunctionInput {
    (): void | Promise<void>;
}

export function defer(callback: DeferFunctionInput): void {
  const runInContext = AsyncLocalStorage.snapshot();
  queue.add(() => runInContext(callback));

  if (!isPending) {
    isPending = true;
    queueMicrotask(() => {
      isPending = false;
      queue.forEach(cb => cb());
      queue.clear();
    });
  }
}
