export const OriginalMethodSymbol = Symbol("originalMethod");

/**
 * Functions decorated by dispatch aren't expected to return
 * any values, useful for jobs that are processed with
 * their own side effects.
 */
export function dispatch<This extends Wired, Args extends any[]>(
  originalMethod: Fn<This, Args, void>,
  context: ClassMethodDecoratorContext<This, Fn<This, Args, void>>
): Fn<This, Args, void> {
  async function callMethod(this: This, ...args: Args): Promise<void> {
    await this.executor.call(originalMethod, args, this, context);
  }

  callMethod[OriginalMethodSymbol] = originalMethod;

  return callMethod;
}

/**
 * Functions decorated by dispatchAwait are expected to return a value
 * just like a regular function call.
 * Some executors might intentionally not support returning a result.
 */
export function dispatchAwait<This extends Wired, Args extends any[], Result>(
  originalMethod: Fn<This, Args, Result>,
  context: ClassMethodDecoratorContext<This, Fn<This, Args, Result>>
): Fn<This, Args, Result> {
  async function callMethod(this: This, ...args: Args): Promise<Result> {
    return this.executor.call(originalMethod, args, this, context);
  }

  callMethod[OriginalMethodSymbol] = originalMethod;

  return callMethod;
}

/**
 * A class implementing Wired can use decorated methods \@dispatch and
 * \@dispatchAwait to delegate function calls to the executor
 */
export interface Wired {
  executor: Executor;
}

/**
 * A class implementing Executor is used by decorated methods \@dispatch and
 * \@dispatchAwait to intercept and process function calls
 */
export interface Executor {
  /**
   * handle decorated function call
   */
  call<This extends Wired, Args extends any[], Result>(
    fn: Fn<This, Args, Result>,
    args: Args,
    fnThis: This,
    fnContext: ClassMethodDecoratorContext<This, Fn<This, Args, Result>>
  ): Promise<Result>;
}

/**
 * type util for decorated functions
 */
export type Fn<This extends Wired, Args extends any[], Result> = (
  this: This,
  ...args: Args
) => Promise<Result>;
