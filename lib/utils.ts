import { Twired } from "./twired";

export function getFnKey(
  fnThis: ThisType<Twired>,
  fn: CallableFunction
): string {
  const className = fnThis.constructor.name;
  const methodName = String(fn.name);
  const key = `${className}.${methodName}`;
  return key;
}
