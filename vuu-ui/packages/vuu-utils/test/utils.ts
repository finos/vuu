import { expect } from "vitest";

export const expectPromiseRejectsWithError = (
  f: () => Promise<unknown>,
  message: string
) => {
  expect(f).rejects.toStrictEqual(new Error(message));
};
