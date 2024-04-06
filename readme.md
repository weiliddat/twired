## Problem Statement

When a codebase evolves to make use of distributed computing, they often have to change how code is written and structured. What used to be a simple function call is turned into `createTask`, `runTask`, `collectTask` calls, often split up into different directories and utilities.

This makes your codebase increasingly hard to understand, slow to debug, and difficult to develop. When you have hundreds of `createTask`, `runTask`, and `collectTask` calls, that's when you'll look to a framework or different system for answers.

However, most of these systems require a lengthy migration process, to rewrite and migrate your currently running tasks into a new system.

This library is written as an answer to this problem.

Get back the experience of writing simple function calls with semantic clarity and type safety. Use your existing jobs, queues, messages. Use your existing deploy pipeline.

## Concepts

- This aims to be a pattern to separate business logic and runtime logic.
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

### Example using a local executor ([file](examples/local-executor/example.ts))

```ts
import { Twired, dispatchAwait } from "../../lib/twired";
import { LocalExecutor } from "./local-executor";

class Greeter extends Twired {
  @dispatchAwait
  async sayHello(name: string) {
    return `Hello ${name}`;
  }
}

async function main() {
  const localExecutor = new LocalExecutor();
  const greeter = new Greeter(localExecutor);
  const greeting = await greeter.sayHello("world");
  assert.equal(greeting, "Hello foo");
}
```

## Example

## TODOs

- [ ] Error types / cases
- [ ] Thread/worker example
- [ ] Redis example
- [ ] MQ example
- [ ] Executor with options example
  - [ ] MQ executor enforces each decorated method needs a distinct queue name
