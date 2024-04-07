import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  SQSClientConfigType,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { DecoratorType, Executor, Fn, Twired } from "twired";
import { getFnKey } from "twired/utils";
import { deserialize, serialize } from "v8";

interface SQSCommandOptions {
  QueueUrl: string;
}

export interface SqsExecutorOpts {
  mode: ExecutionMode;
  machineId: string;
  methodClientOptions: Record<string, SQSClientConfigType>;
  methodQueueOptions: Record<string, SQSCommandOptions>;
}

export enum ExecutionMode {
  Default,
  CallOnly,
}

export class SqsExecutor implements Executor {
  private mode: ExecutionMode;
  private machineId: string;

  private clients: Record<string, SQSClient>;
  private methodClientOptions: Record<string, SQSClientConfigType>;
  private methodQueueOptions: Record<string, SQSCommandOptions>;

  constructor(opts: SqsExecutorOpts) {
    this.mode = opts.mode;
    this.machineId = opts.machineId;
    this.clients = {};
    this.methodClientOptions = opts.methodClientOptions;
    this.methodQueueOptions = opts.methodQueueOptions;
  }

  register<This extends Twired, Args extends any[], Result>(
    fn: Fn<This, Args, Result>,
    fnThis: This,
    _fnContext: ClassMethodDecoratorContext<This, Fn<This, Args, Result>>,
    decoratorType: DecoratorType
  ): void {
    const key = getFnKey(fnThis, fn);

    if (decoratorType !== "dispatch") {
      throw new Error(
        `Registration for ${key} failed. Only dispatch is supported for this executor.`
      );
    }

    const clientConfig = this.methodClientOptions[key];
    const commandOptions = this.methodQueueOptions[key];

    if (!clientConfig || !commandOptions) {
      throw new Error(
        `Registration for ${key} failed. No client configuration found.`
      );
    }

    this.clients[key] = new SQSClient(clientConfig);

    if (this.mode !== ExecutionMode.CallOnly) {
      this.startProcessing(key, fn, fnThis);
    }
  }

  async call<This extends Twired, Args extends any[], Result>(
    fn: Fn<This, Args, Result>,
    args: Args,
    fnThis: This
  ): Promise<Result> {
    const key = getFnKey(fnThis, fn);
    const client = this.clients[key]!;
    const commandOptions = this.methodQueueOptions[key]!;

    console.log(`${this.machineId} Received call for ${key}`);

    const sendMessageCmd = new SendMessageCommand({
      ...commandOptions,
      MessageBody: Buffer.from(serialize(args)).toString("base64"),
    });

    await client.send(sendMessageCmd);

    console.log(`${this.machineId} Dispatched call for ${key}`);

    return null as Result;
  }

  async startProcessing<This extends Twired, Args extends any[], Return>(
    key: string,
    fn: Fn<This, Args, Return>,
    fnThis: This
  ) {
    const client = this.clients[key]!;
    const commandOptions = this.methodQueueOptions[key]!;
    console.log(`${this.machineId} Starting worker for ${key}`);

    while (true) {
      const receiveMessageCmd = new ReceiveMessageCommand({
        ...commandOptions,
        WaitTimeSeconds: 1,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 30,
      });
      const response = await client.send(receiveMessageCmd);

      if (!response.Messages?.length) {
        continue;
      }

      await Promise.allSettled(
        response.Messages.map(async (message) => {
          if (!message.Body) {
            return;
          }

          console.log(`${this.machineId} Received work for ${key}`);

          const args = deserialize(Buffer.from(message.Body, "base64"));
          try {
            await fn.call(fnThis, ...args);
          } catch (error) {
            console.error(error);
          }

          const deleteMessageCmd = new DeleteMessageCommand({
            ...commandOptions,
            ReceiptHandle: message.ReceiptHandle!,
          });
          await client.send(deleteMessageCmd);

          console.log(`${this.machineId} Finished work for ${key}`);
        })
      );
    }
  }
}
