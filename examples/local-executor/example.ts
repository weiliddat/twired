import { LocalExecutor } from "./local-executor";
import { Greeter } from "../greeter";

async function main() {
  const localExecutor = new LocalExecutor();
  const greeter = new Greeter(localExecutor);
  await greeter.sendBirthdayGreeting("Jane");
}

if (require.main === module) {
  main();
}
