## Redis executor example

This is a demo executor using Redis as a backing queue / store.

Instructions:

1. `npm install`
2. `docker compose up --detach`
3. `npx ts-node example.ts`

Characteristics of this executor

- Supports dispatch and dispatchAwait
- Does not support resuming hanging jobs
- Only supports values that are compatible with structureClone
