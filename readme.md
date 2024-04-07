## Problem Statement

When a codebase evolves to make use of distributed computing, they often have to change how code is written and structured. What used to be a simple function call is turned into `createTask`, `runTask`, `collectTask` calls, often split up into different directories and utilities.

This makes your codebase increasingly hard to understand, slow to debug, and difficult to develop. You probably adopt different systems or services for different characteristics and guarantees, multiplying the surface area for developers to understand — hundreds of `createTask`, `sendMessage`, `startJob`, each probably using the same (hopefully?) underlying functions nested deep inside wrapped calls and workers.

This library is written as an answer to this problem.

Experience again writing simple function calls with semantic clarity and type safety.

Port your existing job systems, message queues, run times to an executor you can write in an afternoon. Re-use all of your existing infrastructure, and test them side-by-side!

Run the same functions with different guarantees and characteristics depending on the environment and needs!

## Summary

- This is a pattern to separate business logic and runtime logic.
- This repo provides some sample executors, but they could (should) be replaced by anything that is interface compatible depending on your runtime needs. Use bull / agenda / messages / celery / temporal / whatever as your backend and easily switch them out!
- Makes use of metaprogramming via [decorators](https://2ality.com/2022/10/javascript-decorators.html)
- Inspired by [this paper](https://sigops.org/s/conferences/hotos/2023/papers/ghemawat.pdf) / event loops / rust's async_executor / python's celery
- Easy to migrate — just write an executor compatible with your current job/queue/task system — unlike trying to retool/refactor to a different durable execution runtime or job system
- Advanced executors could have fallbacks to local execution, or on-the-fly adjustment of where to execute code depending on resource usage or desired durability requirements

## Usage

1. `npm install twired`
2. move your function into a `Twired` class / extend your class with an `executor` property
3. decorate your function with `@dispatch` or `@dispatchAwait`
4. use / write an executor to run the decorated functions
5. until decorators are accepted into Ecmascript, you will need a transpiler, e.g. babel / typescript

## Examples

Each of the directories in [examples](examples/) are executable.

Check out each of their readmes!

1. [Local Executor](examples/local-executor/) (this is a minimal example wrapping a regular local function call)
2. [Redis Executor](examples/redis-executor/) (this is an example which support different dispatch and dispatchAwait calls, and separating calling and running functions)
3. [MQ Executor](examples/mq-executor/) (an example showcasing only dispatch type calls, validating executor configuration, and resuming of jobs)

```ts
import { Twired, dispatch, dispatchAwait } from "twired";

class Greeter extends Twired {
  @dispatch
  async greet(recipient: string) {
    const person = await getPerson(recipient);
    const message = await this.generateGreeting(person.name);
    await this.sendGreeting(recipient, message);
  }

  @dispatchAwait
  async generateGreeting(name: string) {
    return `Hello ${name}`;
  }

  @dispatch
  async sendGreeting(recipient: string, message: string) {
    const messageId = await sendEmail(recipient, message);
    await this.saveMessage(messageId);
  }

  @dispatch
  async saveMessage(messageId: string) {
    await saveEvent(messageId);
  }
}

async function main() {
  const executor = new RedisExecutor();
  const greeter = new Greeter(executor);
  const greeting = await greeter.greet("jane@example.com");
}
```

## Concepts

### `dispatch` and `dispatchAwait` decorators

These decorators wrap functions and allow executors to execute them.

`dispatch` is meant for function calls where you do not expect a response, e.g. saving events without waiting for its response. The type signature enforces a `void` return value.

`dispatchAwait` is meant for function calls where you expect a response, e.g. an API server recevies a request, wants to offload processing to a different machine / thread, and receive a result to create a response.

You will notice the distinction is arbitrary. You can technically use `dispatchAwait` for all calls, even for those without a response. I find it useful to make this explicit to understand the decorated function's behavior at a glance.

Executors can also make use of this distinction to optimize wrapped calls, e.g. an executor using messages can make `dispatch` calls return when a message is acknowledged without waiting for the result; an "unsafe" executor can even immediately return `dispatch` calls without waiting for the queue to acknowledge the message.

### Executors

The `Executor` interface defines how an executor deals with `dispatch` and `dispatchAwait` decorated functions.

Executors are expected to implement at least the `call` method, which represents how it deals with a function call from the decorators.

Executors can implement `register`, which will be called on decorator initialization. At the moment, this is the method used by executors to do anything outside of the function call, such as validate options per function call (e.g. needing a specified queue per decorated function), subscribing to whatever run time job/message system, processing work, routing, etc.

### Twired

The `Twired` base class simply ensures that there is an executor attached to the decorated class methods, and that `register` initialization works out of the box.

You can also implement the interface `HasExecutor`, or even avoid all of it if you can ensure you have the `executor` property on your classes on decorator initialization. This requires knowing a bit of decorator-specific knowledge ([ref](https://2ality.com/2022/10/javascript-decorators.html#decorator-initializer-execution)).

## TODOs

- [ ] Error types / cases
- [ ] Thread/worker example
- [x] Redis example
- [ ] MQ example
- [ ] Executor with options example
  - [ ] MQ executor enforces each decorated method needs a distinct queue name
