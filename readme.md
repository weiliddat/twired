Tired: Use jobs/queues and split your code up for load absorption and reliability. Lose semantic relationships.

Wired: Write code as usual, define an executor, retain semantic relationships, gain reliability or flexibility.

Let the runtime wire up your code for you.

- This aims to be a pattern to separate business logic and runtime logic.
- This repo provides some sample executors, but they could (should) be replaced by anything that is interface compatible depending on your runtime needs. Use bull / agenda / messages / celery / temporal / whatever as your backend and easily switch them out!
- Makes use of metaprogramming via [decorators](https://2ality.com/2022/10/javascript-decorators.html)
- Inspired by [this paper](https://sigops.org/s/conferences/hotos/2023/papers/ghemawat.pdf) / event loops / rust's async_executor / python's celery
- Easy to migrate, unlike trying to retool/refactor to a durable execution runtime or job system
- Advanced executors could have fallbacks to local execution, or on-the-fly adjustment of where to execute code depending on resource usage or desired durability requirements
