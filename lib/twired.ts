export const OriginalMethodSymbol = Symbol("originalMethod");

/**
 * Functions decorated by dispatch aren't expected to return
 * any values, useful for jobs that are processed with
 * their own side effects.
 */
export function dispatch<This extends Twired, Args extends any[]>(
  originalMethod: Fn<This, Args, void>,
  context: ClassMethodDecoratorContext<This, Fn<This, Args, void>>
): Fn<This, Args, void> {
  context.addInitializer(function () {
    if (this.executor?.register) {
      this.executor?.register(originalMethod, this, context, "dispatch");
    }
  });

  async function callMethod(this: This, ...args: Args): Promise<void> {
    await this.executor.call(originalMethod, args, this, context, "dispatch");
  }

  callMethod[OriginalMethodSymbol] = originalMethod;

  return callMethod;
}

/**
 * Functions decorated by dispatchAwait are expected to return a value
 * just like a regular function call.
 * Some executors might intentionally not support returning a result.
 */
export function dispatchAwait<This extends Twired, Args extends any[], Result>(
  originalMethod: Fn<This, Args, Result>,
  context: ClassMethodDecoratorContext<This, Fn<This, Args, Result>>
): Fn<This, Args, Result> {
  context.addInitializer(function () {
    if (this.executor.register) {
      this.executor.register(originalMethod, this, context, "dispatchAwait");
    }
  });

  async function callMethod(this: This, ...args: Args): Promise<Result> {
    return this.executor.call(
      originalMethod,
      args,
      this,
      context,
      "dispatchAwait"
    );
  }

  callMethod[OriginalMethodSymbol] = originalMethod;

  return callMethod;
}

/**
 * A base class implementing HasExecutor is the only thing required
 * for the decorators \@dispatch and \@dispatchAwait to work
 *
 * With the current behavior of decorators and initializers, you
 * will need to use a child class that calls super(), otherwise
 * `this.executor` will not be available for the initializer
 */
export interface HasExecutor {
  executor: Executor;
}

/**
 * A class extending Twired can use decorated methods \@dispatch and
 * \@dispatchAwait to delegate function calls to the executor
 */
export class Twired implements HasExecutor {
  executor: Executor;

  constructor(executor: Executor) {
    this.executor = executor;
  }
}

export type DecoratorType = "dispatch" | "dispatchAwait";

/**
 * A class implementing Executor is used by decorated methods \@dispatch and
 * \@dispatchAwait to intercept and process function calls
 */
export interface Executor {
  /**
   * setup execution context
   */
  register?<This extends Twired, Args extends any[], Result>(
    fn: Fn<This, Args, Result>,
    fnThis: This,
    fnContext: ClassMethodDecoratorContext<This, Fn<This, Args, Result>>,
    decoratorType: DecoratorType
  ): void;

  /**
   * handle decorated function call
   */
  call<This extends Twired, Args extends any[], Result>(
    fn: Fn<This, Args, Result>,
    args: Args,
    fnThis: This,
    fnContext: ClassMethodDecoratorContext<This, Fn<This, Args, Result>>,
    decoratorType: "dispatch" | "dispatchAwait"
  ): Promise<Result>;
}

/**
 * type util for decorated functions
 */
export type Fn<This extends Twired, Args extends any[], Result> = (
  this: This,
  ...args: Args
) => Promise<Result>;/**
 * Helper function to return class and function name as a key
 */
