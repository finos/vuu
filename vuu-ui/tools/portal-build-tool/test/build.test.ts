import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildPortal } from "../src/build.js";
import { createPortalBuildPlan, loadPortalBuildConfig } from "../src/config.js";

const temporaryDirectories: string[] = [];

const assetUrls = (html: string, attribute: "src" | "href") =>
  [...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, "g"))].map(
    ([, value]) => value,
  );

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("portal deep-link assets", () => {
  it("configures root-relative assets for both example host modes", () => {
    const configPath = path.resolve(
      "portal-examples/portal-host/portal-build.json",
    );
    const config = loadPortalBuildConfig(configPath);
    for (const mode of ["remote", "local"] as const) {
      expect(createPortalBuildPlan(config, mode).assetPrefix).toBe("/");
    }
    const html = readFileSync(path.join(config.root, "public/index.html"), "utf8");
    expect(html).toContain('rel="manifest" href="/manifest.json"');
    expect(html).toContain('rel="icon" type="image/svg+xml" href="/vuu-icon.svg"');
  });

  it("copies public assets and emits usable deep-link URLs when built from outside the project", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "portal-deep-link-"));
    temporaryDirectories.push(root);
    mkdirSync(path.join(root, "public"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ name: "deep-link-test", version: "1.0.0" }),
    );
    writeFileSync(
      path.join(root, "src/index.js"),
      'document.body.dataset.loaded = "true";',
    );
    writeFileSync(
      path.join(root, "public/index.html"),
      '<!doctype html><html><head><link rel="manifest" href="/manifest.json"><link rel="icon" href="/icon.svg"></head><body></body></html>',
    );
    writeFileSync(
      path.join(root, "public/manifest.json"),
      JSON.stringify({ name: "Deep link test" }),
    );
    writeFileSync(
      path.join(root, "public/icon.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg"/>',
    );
    const configPath = path.join(root, "portal-build.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        version: 1,
        paths: {
          assetPrefix: "/",
          entries: { remote: "./src/index.js", local: "./src/index.js" },
          htmlTemplate: "./public/index.html",
          output: "./dist",
        },
        manifest: { filename: "./config.json", remote: { ssl: false } },
        moduleFederation: { name: "deepLinkTest", shared: {} },
        cssInline: false,
      }),
    );

    expect(process.cwd()).not.toBe(root);
    await buildPortal({ configPath });
    const output = path.join(root, "dist");
    expect(
      JSON.parse(readFileSync(path.join(output, "manifest.json"), "utf8")),
    ).toEqual({ name: "Deep link test" });
    expect(
      JSON.parse(readFileSync(path.join(output, "config.json"), "utf8")),
    ).toEqual({ ssl: false });
    const html = readFileSync(path.join(output, "index.html"), "utf8");
    const scripts = assetUrls(html, "src");
    expect(scripts.length).toBeGreaterThan(0);
    for (const asset of [...scripts, ...assetUrls(html, "href")]) {
      expect(asset).toMatch(/^\/[^/]/);
      const url = new URL(asset, "http://localhost:5001/window/2");
      expect(url.pathname).not.toMatch(/^\/window\//);
      expect(
        readFileSync(path.join(output, url.pathname.slice(1)), "utf8"),
      ).not.toMatch(/^\s*<!doctype html>/i);
    }
  }, 30_000);
});
