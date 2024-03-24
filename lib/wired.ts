/**
 * A class implementing Wired can use decorated methods \@dispatch and \@dispatchAwait
 * to delegate function calls to the executor
 */
export interface Wired {
  executor: Executor;
}

/**
 * A class implementing executor is used by decorated methods \@dispatch and \@dispatchAwait
 * to intercept and process function calls
 */
export interface Executor {}

/**
 * type util for decorated functions
 */
type Fn<This extends Wired, Args extends any[], Result> = (
  this: This,
  ...args: Args
) => Promise<Result>;
