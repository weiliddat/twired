import { createClient } from "@redis/client";
import { RedisClientOptions } from "@redis/client/dist/lib/client";
import { DecoratorType, Executor, Fn, Twired } from "twired";

interface RedisExecutorOpts {
  redisOpts: RedisClientOptions;
  mode: ExecutionMode;
  machineId: string;
}

export enum ExecutionMode {
  Default,
  CallOnly,
}

type RedisClient = ReturnType<typeof createClient>;

/**
 * Redis backed executor that supports separation of function call
 * and function application
 */
export class RedisExecutor implements Executor {
  private redisOpts: RedisClientOptions;
  private mode: ExecutionMode;
  private machineId: string;
  private clients: Record<string, Promise<RedisClient>>;
  private callIdClient: Promise<RedisClient>;

  constructor(opts: RedisExecutorOpts) {
    this.machineId = opts.machineId;
    this.mode = opts.mode;
    this.redisOpts = opts.redisOpts;
    this.clients = {};
    this.callIdClient = createClient(this.redisOpts)
      .on("error", (err) => console.error(err))
      .connect();
  }

  /**
   * Called on each function decoration, to set up a redis client for
   * each function
   * Also starts the processing function to respond to decorated calls
   */
  async register<This extends Twired, Args extends any[], Result>(
    fn: Fn<This, Args, Result>,
    fnThis: This
  ): Promise<void> {
    const key = getFnKey(fnThis, fn);
    const fnClient = createClient(this.redisOpts)
      .on("error", (err) => console.error(err))
      .connect();
    this.clients[key] = fnClient;

    /**
     * sets up a possibility for a call-only executor instance
     * e.g. in a server where you don't want to do any processing
     * work
     */
    if (this.mode !== ExecutionMode.CallOnly) {
      void this.startProcessing(key, fn, fnThis);
    }
  }

  /**
   * Dispatches calls through redis to processing function
   * Calls are identified by function name and an incrementing key
   * Arguments are saved to a KV store (in this case redis itself)
   * Waits for a response and gets the result from the KV store
   */
  async call<This extends Twired, Args extends any[], Result>(
    fn: Fn<This, Args, Result>,
    args: Args,
    fnThis: This,
    _context: ClassMethodDecoratorContext<This, Fn<This, Args, Result>>,
    decoratorType: DecoratorType
  ): Promise<Result> {
    const key = getFnKey(fnThis, fn);
    console.log(`${this.machineId} Received call for ${key}`);

    const client = await this.clients[key];
    if (!client) throw new Error(`Client not found for key: ${key}`);

    const callId = await this.getCallId(key);

    // save arguments, for demonstration purposes we're using redis itself
    const argumentId = `callArgs.${key}.${callId}`;
    await client.set(argumentId, JSON.stringify(args));

    // notify worker about call
    await client.lPush(key, callId);

    // for dispatch type calls we can avoid waiting for results and return early
    if (decoratorType === "dispatch") {
      console.log(`${this.machineId} Returning void for ${key}`);
      return null as any;
    }

    // wait for worker to finish
    const responseId = `${key}.${callId}`;
    const workerResponse = await client.brPop(responseId, 0);

    if (!workerResponse) {
      throw new Error(`Call ${key}.${callId} failed without worker response`);
    }

    // get result
    const result = await client.get(workerResponse.element);

    if (!result) {
      throw new Error(`Call ${key}.${callId} failed without result`);
    }

    console.log(`${this.machineId} Returning call for ${key}`);
    return JSON.parse(result);
  }

  /**
   * Waits for incoming calls
   * Gets arguments from the KV store
   * Processes / applies the arguments
   * Saves the result to the KV store
   * Signals the caller that work is done
   */
  async startProcessing<This extends Twired, Args extends any[], Return>(
    key: string,
    fn: Fn<This, Args, Return>,
    fnThis: This
  ) {
    const client = await createClient(this.redisOpts)
      .on("error", (err) => console.error(err))
      .connect();
    console.log(`${this.machineId} Starting work for ${key}`);

    while (true) {
      // wait for calls
      const callId = await client.brPop(key, 0);
      if (!callId) {
        continue;
      }
      console.log(
        `${this.machineId} Received work for ${key} ${callId.element}`
      );

      // get saved arguments
      const argumentId = `callArgs.${key}.${callId.element}`;
      const args = await client.get(argumentId);
      if (!args) {
        throw new Error(`Failed to get arguments for call ${key}`);
      }

      // parse and apply arguments
      const parsedArgs = JSON.parse(args);
      const result = (await fn.apply(fnThis, parsedArgs)) ?? null;

      // save results
      const resultId = `callResult.${key}.${callId.element}`;
      await client.set(resultId, JSON.stringify(result));

      // notify worker
      const responseId = `${key}.${callId.element}`;
      await client.lPush(responseId, resultId);
      console.log(
        `${this.machineId} Finished work for ${key} ${callId.element}`
      );
    }
  }

  /**
   * Gets an incrementing key based on class and function name
   */
  async getCallId(name: string) {
    const client = await this.callIdClient;
    const callId = await client.incr(`callId.${name}`);
    return callId.toString();
  }
}

/**
 * Helper function to return class and function name as a key
 */
function getFnKey(fnThis: ThisType<Twired>, fn: CallableFunction): string {
  const className = fnThis.constructor.name;
  const methodName = String(fn.name);
  const key = `${className}.${methodName}`;
  return key;
}
