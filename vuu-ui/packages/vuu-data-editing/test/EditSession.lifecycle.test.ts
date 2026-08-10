import type { EditApi } from "@vuu-ui/vuu-data-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditSession } from "../src";

type Editable = Required<EditApi>;
type BeginEdit = Editable["beginEditSession"];
type CreateSession = Editable["createSessionDataSource"];
type EndEdit = Editable["endEditSession"];

class MockDataSource implements EditApi {
  constructor(
    private beginEdit: BeginEdit,
    private endEdit: EndEdit,
    private createSession: CreateSession,
  ) {}

  beginEditSession(...args: Parameters<BeginEdit>) {
    return this.beginEdit(...args);
  }

  endEditSession(...args: Parameters<EndEdit>) {
    return this.endEdit(...args);
  }

  createSessionDataSource(...args: Parameters<CreateSession>) {
    return this.createSession(...args);
  }
}

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

describe("EditSession lifecycle", () => {
  let beginEdit: BeginEdit;
  let createSession: CreateSession;
  let editSession: EditSession;
  let endEdit: EndEdit;

  beforeEach(() => {
    beginEdit = vi.fn();
    createSession = vi.fn();
    endEdit = vi.fn();
    editSession = new EditSession(
      new MockDataSource(beginEdit, endEdit, createSession),
    );
  });

  it("publishes lifecycle transitions", async () => {
    const lifecycleListener = vi.fn();
    editSession.on("lifecycle", lifecycleListener);

    await editSession.begin();
    await editSession.end();

    expect(lifecycleListener.mock.calls.map(([state]) => state.status)).toEqual(
      ["starting", "active", "ending", "idle"],
    );
  });

  it("serializes end behind a pending begin", async () => {
    const pendingBegin = deferred<undefined>();
    beginEdit = vi.fn(() => pendingBegin.promise);
    editSession = new EditSession(
      new MockDataSource(beginEdit, endEdit, createSession),
    );

    const beginPromise = editSession.begin();
    await Promise.resolve();
    expect(editSession.lifecycle.status).toBe("starting");

    const endPromise = editSession.end();
    expect(endEdit).not.toHaveBeenCalled();

    pendingBegin.resolve(undefined);
    await beginPromise;
    await endPromise;

    expect(beginEdit).toHaveBeenCalledTimes(1);
    expect(endEdit).toHaveBeenCalledTimes(1);
    expect(editSession.lifecycle).toEqual({ status: "idle" });
  });

  it("does not begin a second session when begin is queued twice", async () => {
    await Promise.all([editSession.begin(), editSession.begin()]);

    expect(beginEdit).toHaveBeenCalledTimes(1);
    expect(editSession.lifecycle.status).toBe("active");
  });

  it("routes standalone and inline sessions to the appropriate datasource API", async () => {
    await editSession.begin("All");

    expect(createSession).toHaveBeenCalledWith("All");
    expect(beginEdit).not.toHaveBeenCalled();

    await editSession.end();
    editSession = new EditSession(
      new MockDataSource(beginEdit, endEdit, createSession),
    );
    await editSession.begin("inline-all-rows");

    expect(beginEdit).toHaveBeenCalledWith("inline-all-rows");
  });

  it("keeps a failed end session active and allows retry", async () => {
    const endError = new Error("end failed");
    endEdit = vi
      .fn()
      .mockRejectedValueOnce(endError)
      .mockResolvedValueOnce(undefined);
    editSession = new EditSession(
      new MockDataSource(beginEdit, endEdit, createSession),
    );

    await editSession.begin();
    await expect(editSession.end()).rejects.toBe(endError);

    expect(editSession.lifecycle).toMatchObject({
      status: "error",
      operation: "end",
      error: endError,
    });
    expect(editSession.inEditMode).toBe(true);

    await editSession.end();
    expect(editSession.lifecycle).toEqual({ status: "idle" });
  });

  it("reports begin failures without entering edit mode", async () => {
    const beginError = new Error("begin failed");
    beginEdit = vi.fn().mockRejectedValueOnce(beginError);
    editSession = new EditSession(
      new MockDataSource(beginEdit, endEdit, createSession),
    );

    await expect(editSession.begin()).rejects.toBe(beginError);

    expect(editSession.lifecycle).toMatchObject({
      status: "error",
      operation: "begin",
      error: beginError,
    });
    expect(editSession.inEditMode).toBe(false);
  });
});
