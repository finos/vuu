import type { Locator, TestType } from "@playwright/test";

export declare const test: TestType<{
  coverage: undefined;
  mount: (
    story: string,
    props?: Record<string, unknown>,
  ) => Promise<Locator>;
}>;
export declare const expect: typeof import("@playwright/test").expect;
