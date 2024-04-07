## Message queue executor example

This is a demo executor using SQS as a backing queue / store.

Instructions:

1. `npm install`
2. `docker compose up --detach`
3. In one terminal, run `npx ts-node example-worker.ts`
4. In another terminal, repeatedly run `npx ts-node example-client.ts`

Characteristics of this executor

- Single message queue per method (enforced through decoration registration)
- Supports only dispatch calls
- Support resuming hanging jobs
- Only supports values that are compatible with structureClone
- Retry / DLQ / FIFO characteristics are dependent on the backing queue
