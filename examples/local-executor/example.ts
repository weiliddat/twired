import assert from "node:assert";
import { Wired, dispatchAwait } from "../../lib/wired";
import { LocalExecutor } from "./local-executor";

class Greeter extends Wired {
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

if (require.main === module) {
  main();
}
