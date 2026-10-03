import type { Page } from "@playwright/test";

/**
 * JS heap size in bytes, sampled via the CDP Performance domain. Forces a GC
 * pass first (also CDP, Chromium-only) so churn from prior scenario steps
 * doesn't leak into the sample.
 */
export async function sampleHeapUsedBytes(page: Page): Promise<number> {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("HeapProfiler.enable");
    await client.send("HeapProfiler.collectGarbage");
  } catch {
    // best-effort; proceed without forced GC if unsupported
  }
  await client.send("Performance.enable");
  const { metrics } = await client.send("Performance.getMetrics");
  const heap = metrics.find((m) => m.name === "JSHeapUsedSize");
  await client.detach().catch(() => undefined);
  return heap?.value ?? NaN;
}
