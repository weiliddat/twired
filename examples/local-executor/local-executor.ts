import { Executor, Fn, Twired } from "../../lib/twired";

/**
 * An example of an executor that calls the wrapped function like
 * a normal function
 */
export class LocalExecutor implements Executor {
  call<This extends Twired, Args extends any[], Result>(
    fn: Fn<This, Args, Result>,
    args: Args,
    fnThis: This
  ): Promise<Result> {
    console.info(`[local] calling ${fn.name}`)
    return fn.call(fnThis, ...args);
  }
}
