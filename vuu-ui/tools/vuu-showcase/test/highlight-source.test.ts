import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { sourceUrl, writeHighlightedSources } from "../scripts/highlight-source";

describe("writeHighlightedSources", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "highlight-source-"));
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("writes each source under outDir at its source url", async () => {
    const showcaseDir = path.join(tmp, "showcase");
    const outDir = path.join(tmp, "out");
    const examplePath = "./src/examples/Table/Misc.examples.tsx";
    const file = path.join(showcaseDir, examplePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "export const A = () => null;\n");

    const count = await writeHighlightedSources(
      [examplePath],
      showcaseDir,
      outDir,
    );

    expect(count).toBe(1);
    const target = path.join(outDir, sourceUrl(examplePath));
    expect(target.startsWith(outDir + path.sep)).toBe(true);
    const { lines } = JSON.parse(fs.readFileSync(target, "utf8"));
    expect(lines.length).toBeGreaterThan(0);
  });
});
