import "./global-mocks";
import { describe, expect, it } from "vitest";
import {
  clientRow,
  groupRows,
  rows,
  serverProxyHarness,
  serverRequest,
  size,
  update,
  viewportUpdate,
  type ServerProxyHarness,
} from "./server-proxy-dsl";

const openTreeNode = (treeKey: string | undefined) =>
  serverRequest({ type: "OPEN_TREE_NODE", vpId: "server-vp-1", treeKey });
const closeTreeNode = (treeKey: string | undefined) =>
  serverRequest({ type: "CLOSE_TREE_NODE", vpId: "server-vp-1", treeKey });
const freezeVp = () =>
  serverRequest({ type: "FREEZE_VP", viewPortId: "server-vp-1" });
const unfreezeVp = () =>
  serverRequest({ type: "UNFREEZE_VP", viewPortId: "server-vp-1" });

/** Groups by col-4, acks the CHANGE_VP and loads the four group rows. */
const groupedViewport = async () => {
  const t = await serverProxyHarness();
  t.client.config({ groupBy: ["col-4"] });
  t.server.acks("CHANGE_VP");
  t.server.sends(groupRows());
  t.discard();
  return t;
};

/** Freezes client-vp-1 and has the server ACK it. */
const freeze = (t: ServerProxyHarness) => {
  t.client.freeze();
  t.server.acks("FREEZE_VP");
  t.discard();
};

describe("ServerProxy", () => {
  describe("tree nodes", () => {
    it("openTreeNode with a key sends OPEN_TREE_NODE for that key", async () => {
      const t = await groupedViewport();
      t.client.openTreeNode({ key: "$root|USD" });
      t.expectServer(openTreeNode("$root|USD"));
      t.expectClient();
    });

    it("closeTreeNode with a key sends CLOSE_TREE_NODE for that key", async () => {
      const t = await groupedViewport();
      t.client.closeTreeNode({ key: "$root|USD" });
      t.expectServer(closeTreeNode("$root|USD"));
      t.expectClient();
    });

    it("openTreeNode with an index uses the key of the cached row at that index", async () => {
      const t = await groupedViewport();
      t.client.openTreeNode({ index: 1 });
      t.expectServer(openTreeNode("$root|EUR"));
    });

    it("closeTreeNode with an index uses the key of the cached row at that index", async () => {
      const t = await groupedViewport();
      t.client.closeTreeNode({ index: 3 });
      t.expectServer(closeTreeNode("$root|CAD"));
    });

    it("index takes precedence over key", async () => {
      const t = await groupedViewport();
      t.client.openTreeNode({ index: 2, key: "$root|USD" });
      t.expectServer(openTreeNode("$root|GBX"));
    });

    it("an index with no cached row sends an undefined treeKey", async () => {
      // current behaviour: the request is still sent, with no treeKey
      const t = await groupedViewport();
      t.client.openTreeNode({ index: 10 });
      t.expectServer(openTreeNode(undefined));
    });

    it("tree requests are not sent before the subscription is ACKed", async () => {
      const t = await serverProxyHarness({ subscribe: false });
      const subscription = t.startSubscription();
      t.discard();

      t.client.openTreeNode({ key: "$root|USD" });
      t.client.closeTreeNode({ key: "$root|USD" });
      t.expectServer();
      t.expectClient();

      // nor are they queued for later
      await subscription.complete();
      t.discard();
      expect(t.proxyState().queuedRequestCount).toEqual(0);
    });

    it("OPEN_TREE_SUCCESS and CLOSE_TREE_SUCCESS are ignored", async () => {
      const t = await groupedViewport();
      t.client.openTreeNode({ key: "$root|USD" });
      t.server.replies("OPEN_TREE_NODE", {
        type: "OPEN_TREE_SUCCESS",
        vpId: "server-vp-1",
      });
      t.client.closeTreeNode({ key: "$root|USD" });
      t.server.replies("CLOSE_TREE_NODE", {
        type: "CLOSE_TREE_SUCCESS",
        vpId: "server-vp-1",
      });
      t.discard();
      t.expectClient();
    });
  });

  describe("freeze", () => {
    it("freeze sends FREEZE_VP; the viewport is not frozen until ACKed", async () => {
      const t = await serverProxyHarness();
      t.client.freeze();
      t.expectServer(freezeVp());
      t.expectClient();
      expect(t.viewportState().frozen).toBe(false);
    });

    it("FREEZE_VP_SUCCESS sets frozen and tells the client", async () => {
      const t = await serverProxyHarness();
      t.client.freeze();
      t.server.acks("FREEZE_VP");
      t.expectClient({ type: "frozen", clientViewportId: "client-vp-1" });
      expect(t.viewportState().frozen).toBe(true);
    });

    it("FREEZE_VP_SUCCESS with an unknown request id changes nothing", async () => {
      const t = await serverProxyHarness();
      t.client.freeze();
      t.discard();
      t.server.receives(
        { type: "FREEZE_VP_SUCCESS", viewPortId: "server-vp-1" },
        "no-such-request",
      );
      t.expectClient();
      expect(t.viewportState().frozen).toBe(false);
    });

    it("FREEZE_VP_SUCCESS for an unknown viewport is ignored", async () => {
      const t = await serverProxyHarness();
      t.client.freeze();
      t.discard();
      t.server.receives(
        { type: "FREEZE_VP_SUCCESS", viewPortId: "server-vp-9" },
        t.requestIdOf("FREEZE_VP"),
      );
      t.expectClient();
      expect(t.viewportState().frozen).toBe(false);
    });

    it("freeze before the subscription is ACKed sends nothing", async () => {
      const t = await serverProxyHarness({ subscribe: false });
      const subscription = t.startSubscription();
      t.discard();

      t.client.freeze();
      t.expectServer();

      await subscription.complete();
      t.discard();
      expect(t.viewportState().frozen).toBe(false);
    });

    it("unfreeze does nothing when the viewport is not frozen", async () => {
      const t = await serverProxyHarness();
      t.client.unfreeze();
      t.expectServer();
      t.expectClient();
    });

    it("unfreeze sends UNFREEZE_VP and clears frozen before the ACK", async () => {
      const t = await serverProxyHarness();
      freeze(t);

      t.client.unfreeze();
      t.expectServer(unfreezeVp());
      t.expectClient();
      expect(t.viewportState().frozen).toBe(false);
    });

    it("UNFREEZE_VP_SUCCESS tells the client", async () => {
      const t = await serverProxyHarness();
      freeze(t);

      t.client.unfreeze();
      t.server.acks("UNFREEZE_VP");
      t.expectClient({ type: "unfrozen", clientViewportId: "client-vp-1" });
      expect(t.viewportState().frozen).toBe(false);
    });

    it("UNFREEZE_VP_SUCCESS for an unknown viewport is ignored", async () => {
      const t = await serverProxyHarness();
      freeze(t);
      t.client.unfreeze();
      t.discard();
      t.server.receives(
        { type: "UNFREEZE_VP_SUCCESS", viewPortId: "server-vp-9" },
        t.requestIdOf("UNFREEZE_VP"),
      );
      t.expectClient();
    });

    it("a second unfreeze sends nothing", async () => {
      const t = await serverProxyHarness();
      freeze(t);
      t.client.unfreeze();
      t.discard();

      t.client.unfreeze();
      t.expectServer();
    });

    it("updates are still sent to the client while frozen", async () => {
      // current behaviour: frozen is a flag only, the proxy does not hold
      // back updates (the server is expected to stop sending them)
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      freeze(t);

      t.server.sends(update(3, 2004));
      t.expectClient(
        viewportUpdate({ rows: [clientRow(3, { ts: 2, value: 2004 })] }),
      );
    });
  });
});
