import type {
  Locator,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
} from "@playwright/test";

type VuuTestFixtures = {
  coverage: undefined;
  mount: (
    story: string,
    props?: Record<string, unknown>,
  ) => Promise<Locator>;
};

export declare const test: TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & VuuTestFixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>;
export declare const expect: typeof import("@playwright/test").expect;
