import { ExecutionMode, RedisExecutor } from "./redis-executor";
import { Greeter } from "../greeter";

/**
 * Running this example, `npx ts-node example.ts`, you should
 * see the server and worker-prepended logs showing where
 * each function is being called and executed
 */

async function server() {
  const executor = new RedisExecutor({
    redisOpts: { url: "redis://localhost:6379" },
    machineId: "server",
    mode: ExecutionMode.CallOnly,
  });

  const greeter = new Greeter(executor);

  await greeter.sendBirthdayGreeting("Jane");
}

async function worker() {
  const executor = new RedisExecutor({
    redisOpts: { url: "redis://localhost:6379" },
    machineId: "worker",
    mode: ExecutionMode.Default,
  });

  new Greeter(executor);
}

server();
worker();
