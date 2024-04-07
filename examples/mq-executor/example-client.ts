import { ExecutionMode, SqsExecutor } from "./sqs-executor";
import { Greeter } from "./greeter";

const clientOptions = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "localstack",
    secretAccessKey: "localstack",
  },
};

async function client() {
  const executor = new SqsExecutor({
    machineId: "worker",
    mode: ExecutionMode.CallOnly,
    methodClientOptions: {
      "Greeter.sendBirthdayGreeting": clientOptions,
      "Greeter.generateAndSendGreeting": clientOptions,
      "Greeter.sendEmail": clientOptions,
      "Greeter.saveEmail": clientOptions,
    },
    methodQueueOptions: {
      "Greeter.sendBirthdayGreeting": {
        QueueUrl: "http://localhost:4566/000000000000/sendBirthdayGreeting",
      },
      "Greeter.generateAndSendGreeting": {
        QueueUrl: "http://localhost:4566/000000000000/generateAndSendGreeting",
      },
      "Greeter.sendEmail": {
        QueueUrl: "http://localhost:4566/000000000000/sendEmail",
      },
      "Greeter.saveEmail": {
        QueueUrl: "http://localhost:4566/000000000000/saveEmail",
      },
    },
  });

  const greeter = new Greeter(executor);
  const recipient = Math.random() > 0.5 ? "Jane" : "John";
  console.log(`Send greeting to ${recipient}`);
  await greeter.sendBirthdayGreeting(recipient);
}

client();
