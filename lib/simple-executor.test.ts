import {
  Executor,
  OriginalMethodSymbol,
  Twired,
  dispatch,
  dispatchAwait,
} from "./twired";
import { jest, describe, test, expect } from "@jest/globals";

const executorCallFn = jest.fn<any>();

class TestExecutor implements Executor {
  call = executorCallFn;
}

class TestWiredWorkflow extends Twired {
  @dispatch
  async foo(_a: string, _b: number) {
    return;
  }

  @dispatchAwait
  async bar(_a: number, _b: string) {
    return 0;
  }
}

describe("Simple executor", () => {
  test("dispatch decorators should call the executor's call method and returns void", async () => {
    const testExecutor = new TestExecutor();
    const testWiredWorkflow = new TestWiredWorkflow(testExecutor);

    const result = await testWiredWorkflow.foo("a", 2);

    expect(executorCallFn).toHaveBeenCalledWith(
      (testWiredWorkflow.foo as any)[OriginalMethodSymbol],
      ["a", 2],
      testWiredWorkflow,
      expect.anything()
    );

    expect(result).toBeUndefined();
  });

  test("dispatchAwait decorators should call the executor's call method and returns the result", async () => {
    const testExecutor = new TestExecutor();
    const testWiredWorkflow = new TestWiredWorkflow(testExecutor);
    executorCallFn.mockReturnValue(42);

    const result = await testWiredWorkflow.bar(4, "2");

    expect(executorCallFn).toHaveBeenCalledWith(
      (testWiredWorkflow.bar as any)[OriginalMethodSymbol],
      [4, "2"],
      testWiredWorkflow,
      expect.anything()
    );

    expect(result).toBe(42);
  });
});
