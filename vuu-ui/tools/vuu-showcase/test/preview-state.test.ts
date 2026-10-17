import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREVIEW_STATE,
  readPreviewState,
  sanitisePreviewState,
  standaloneDocUrl,
  standaloneUrl,
  writePreviewParams,
} from "../src/showcase-main/example/preview-state";

describe("preview-state", () => {
  it("uses defaults when there are no params or preferences", () => {
    expect(readPreviewState(new URLSearchParams())).toEqual(
      DEFAULT_PREVIEW_STATE,
    );
  });

  it("url params take precedence over preferences", () => {
    const state = readPreviewState(
      new URLSearchParams("density=touch&mode=dark"),
      { density: "low", theme: "salt-theme-next" },
    );
    expect(state).toEqual({
      ...DEFAULT_PREVIEW_STATE,
      density: "touch",
      mode: "dark",
      theme: "salt-theme-next",
    });
  });

  it("ignores invalid values", () => {
    expect(
      sanitisePreviewState({
        density: "huge",
        ds: "remote",
        mode: 1,
        theme: "evil-theme",
        vp: "1024",
      }),
    ).toEqual({ ds: "remote", vp: "1024" });
  });

  it("round trips through url params, preserving other params", () => {
    const state = {
      density: "medium",
      ds: "remote",
      mode: "dark",
      theme: "no-theme",
      vp: "768",
    } as const;
    const params = writePreviewParams(new URLSearchParams("tab=source"), state);
    expect(params.get("tab")).toBe("source");
    expect(readPreviewState(params)).toEqual(state);
  });

  it("only writes the values provided", () => {
    const params = writePreviewParams(new URLSearchParams("mode=dark"), {
      density: "low",
    });
    expect(params.toString()).toBe("mode=dark&density=low");
  });

  it("builds the standalone url understood by the iframe", () => {
    expect(
      standaloneUrl("/Table/Misc/TestTable", DEFAULT_PREVIEW_STATE, "a b"),
    ).toBe(
      "/Table/Misc/TestTable?standalone&theme=vuu-theme&anchor=a%20b#themeMode=light,density=high,dataLocation=local",
    );
  });

  it("builds the url of an example embedded in a document", () => {
    expect(
      standaloneUrl(
        "/Docs/Table/Columns/Pinned",
        DEFAULT_PREVIEW_STATE,
        null,
        true,
      ),
    ).toBe(
      "/Docs/Table/Columns/Pinned?standalone&theme=vuu-theme&embed#themeMode=light,density=high,dataLocation=local",
    );
  });

  it("builds the url of a document in its own window", () => {
    expect(
      standaloneDocUrl("/Docs/Table/Columns", DEFAULT_PREVIEW_STATE, "pinned"),
    ).toBe(
      "/Docs/Table/Columns?standalone&density=high&ds=local&mode=light&theme=vuu-theme&vp=fill&anchor=pinned",
    );
  });
});
