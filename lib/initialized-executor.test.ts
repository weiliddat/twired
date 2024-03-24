import {
  Executor,
  OriginalMethodSymbol,
  Wired,
  dispatch,
  dispatchAwait,
} from "./wired";
import { jest, describe, test, expect } from "@jest/globals";

const executorRegisterFn = jest.fn<any>();
const executorCallFn = jest.fn<any>();

class TestExecutor implements Executor {
  register = executorRegisterFn;
  call = executorCallFn;
}

class TestWiredWorkflow extends Wired {
  @dispatch
  async foo(a: string, b: number) {
    return;
  }

  @dispatchAwait
  async bar(a: number, b: string) {
    return 0;
  }
}

describe("Executor that requires an initializer for setup", () => {
  test("dispatch decorators should call the executor's call method and returns void", async () => {
    const testExecutor = new TestExecutor();
    const testWiredWorkflow = new TestWiredWorkflow(testExecutor);

    expect(executorRegisterFn).toHaveBeenCalledWith(
      (testWiredWorkflow.foo as any)[OriginalMethodSymbol],
      testWiredWorkflow,
      expect.anything()
    );

    const result = await testWiredWorkflow.foo("a", 2);

    expect(executorCallFn).toHaveBeenCalledWith(
      (testWiredWorkflow.foo as any)[OriginalMethodSymbol],
      ["a", 2],
      testWiredWorkflow,
      expect.anything()
    );

    expect(result).toBeUndefined();
  });

  test("dispatchAwait should call register and the original method", async () => {
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
