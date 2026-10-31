import "./global-mocks";
import { describe, expect, it } from "vitest";
import type {
  LinkDescriptorWithLabel,
  VuuLinkDescriptor,
} from "@vuu-ui/vuu-protocol-types";
import {
  createVpBody,
  serverProxyHarness,
  serverRequest,
  subscribedMessage,
  type ServerProxyHarness,
} from "./server-proxy-dsl";
import { createSubscription } from "./test-utils";

/* Local helpers ---------------------------------------------------- */

/** A link from a child viewport to the parent server viewport. */
const linkTo = (
  parentVpId: string,
  fromColumn = "col-1",
  toColumn = "col-1",
): VuuLinkDescriptor => ({
  parentVpId,
  link: { fromColumn, toTable: "test-table", toColumn },
});

/** VP_VISUAL_LINKS_RESP body: the links available to viewport vpId. */
const linksResponse = (vpId: string, links: VuuLinkDescriptor[]) => ({
  type: "VP_VISUAL_LINKS_RESP",
  vpId,
  links,
});

/** vuu-links message the proxy posts for a client viewport. */
const vuuLinks = (clientViewportId: string, links: object[]) => ({
  type: "vuu-links",
  clientViewportId,
  links,
});

/** Two subscribed viewports, client-vp-1 / server-vp-1 and client-vp-2 / server-vp-2. */
const twoViewports = async () => {
  const t = await serverProxyHarness();
  await t.subscribe({ key: "2" });
  t.discard();
  return t;
};

/** Subscribes client-vp-2 with a visualLink to client-vp-1 and waits for the ACKs. */
const subscribeLinkedChild = async (
  t: ServerProxyHarness,
  visualLink: LinkDescriptorWithLabel,
) => {
  const [request, ack, tableMeta] = createSubscription({ key: "2" });
  const subscribed = t.proxy.subscribe({ ...request, visualLink });
  t.proxy.handleMessageFromServer(ack);
  t.proxy.handleMessageFromServer(tableMeta);
  await subscribed;
};

describe("ServerProxy visual links", () => {
  describe("VP_VISUAL_LINKS_RESP", () => {
    it("posts vuu-links to the child, labelled with the parent's client id and title", async () => {
      const t = await twoViewports();
      t.client.setTitle("Parent", "client-vp-1");
      // client-vp-2 has no links yet, so the title change posts nothing
      t.expectClient();

      t.server.receives(linksResponse("server-vp-2", [linkTo("server-vp-1")]));
      t.expectClient(
        vuuLinks("client-vp-2", [
          {
            ...linkTo("server-vp-1"),
            parentClientVpId: "client-vp-1",
            label: "Parent",
          },
        ]),
      );
      t.expectServer();
      expect(t.viewportState("server-vp-2").links).toEqual([
        {
          ...linkTo("server-vp-1"),
          parentClientVpId: "client-vp-1",
          label: "Parent",
        },
      ]);
    });

    it("has no label when the parent has no title", async () => {
      const t = await twoViewports();
      t.server.receives(linksResponse("server-vp-2", [linkTo("server-vp-1")]));
      t.expectClient(
        vuuLinks("client-vp-2", [
          {
            ...linkTo("server-vp-1"),
            parentClientVpId: "client-vp-1",
            label: undefined,
          },
        ]),
      );
    });

    it("drops links whose parent viewport is unknown or suspended", async () => {
      const t = await twoViewports();
      t.client.suspend("client-vp-1", { escalateToDisable: false });

      t.server.receives(
        linksResponse("server-vp-2", [
          linkTo("server-vp-1"),
          linkTo("server-vp-9"),
        ]),
      );
      t.expectClient();
      expect(t.viewportState("server-vp-2").links).toBeUndefined();

      t.client.resume("client-vp-1");
      t.discard();
      t.server.receives(
        linksResponse("server-vp-2", [
          linkTo("server-vp-9"),
          linkTo("server-vp-1"),
        ]),
      );
      t.expectClient(
        vuuLinks("client-vp-2", [
          { ...linkTo("server-vp-1"), parentClientVpId: "client-vp-1" },
        ]),
      );
    });

    it("drops a link from a viewport to itself", async () => {
      const t = await twoViewports();
      t.server.receives(
        linksResponse("server-vp-2", [
          linkTo("server-vp-2"),
          linkTo("server-vp-1"),
        ]),
      );
      t.expectClient(
        vuuLinks("client-vp-2", [
          { ...linkTo("server-vp-1"), parentClientVpId: "client-vp-1" },
        ]),
      );
    });

    it("posts an empty link list when the only active link is to the viewport itself", async () => {
      // current behaviour: the self link counts as active, so a message is
      // posted, then setLinks filters it out
      const t = await twoViewports();
      t.server.receives(linksResponse("server-vp-2", [linkTo("server-vp-2")]));
      t.expectClient(vuuLinks("client-vp-2", []));
    });

    it("posts nothing for an unknown viewport", async () => {
      const t = await twoViewports();
      t.server.receives(linksResponse("server-vp-9", [linkTo("server-vp-1")]));
      t.expectClient();
      t.expectServer();
    });

    it("creates the link requested at subscription once the link is available, then only once", async () => {
      const t = await serverProxyHarness();
      const visualLink = {
        ...linkTo("server-vp-1", "col-2", "col-1"),
        parentClientVpId: "client-vp-1",
      };
      await subscribeLinkedChild(t, visualLink);
      t.discard();

      t.server.receives(
        linksResponse("server-vp-2", [linkTo("server-vp-1", "col-2", "col-1")]),
      );
      t.expectClient(
        vuuLinks("client-vp-2", [
          {
            ...linkTo("server-vp-1", "col-2", "col-1"),
            parentClientVpId: "client-vp-1",
          },
        ]),
      );
      t.expectServer(
        serverRequest({
          type: "CREATE_VISUAL_LINK",
          childVpId: "server-vp-2",
          childColumnName: "col-2",
          parentColumnName: "col-1",
          parentVpId: "server-vp-1",
        }),
      );

      t.server.replies("CREATE_VISUAL_LINK", {
        type: "CREATE_VISUAL_LINK_SUCCESS",
        childVpId: "server-vp-2",
        parentVpId: "server-vp-1",
        childColumnName: "col-2",
        parentColumnName: "col-1",
      });
      t.expectClient({
        requestId: t.requestIdOf("CREATE_VISUAL_LINK"),
        type: "vuu-link-created",
        clientViewportId: "client-vp-2",
        colName: "col-2",
        parentViewportId: "client-vp-1",
        parentColName: "col-1",
      });

      // the pending link is cleared once created
      t.server.receives(
        linksResponse("server-vp-2", [linkTo("server-vp-1", "col-2", "col-1")]),
      );
      t.expectServer();
    });
  });

  describe("CREATE_VISUAL_LINK", () => {
    it("sends the request with the parent's server viewport id", async () => {
      const t = await twoViewports();
      t.client.createLink();
      t.expectClient();
      t.expectServer(
        serverRequest(
          {
            type: "CREATE_VISUAL_LINK",
            parentVpId: "server-vp-1",
            parentColumnName: "col-1",
            childColumnName: "col-1",
            childVpId: "server-vp-2",
          },
          "req1",
        ),
      );
    });

    it("throws when the parent viewport is unknown", async () => {
      const t = await twoViewports();
      expect(() => t.client.createLink({ parent: "client-vp-9" })).toThrow(
        "createLink parent viewport not found client-vp-9",
      );
      t.expectServer();
    });

    it("posts vuu-link-created when the server confirms the link", async () => {
      const t = await twoViewports();
      t.client.createLink();
      t.discard();

      t.server.receives(
        {
          type: "CREATE_VISUAL_LINK_SUCCESS",
          childVpId: "server-vp-2",
          parentVpId: "server-vp-1",
          childColumnName: "col-1",
          parentColumnName: "col-1",
        },
        "req1",
      );
      t.expectClient({
        requestId: "req1",
        type: "vuu-link-created",
        clientViewportId: "client-vp-2",
        colName: "col-1",
        parentViewportId: "client-vp-1",
        parentColName: "col-1",
      });
    });

    it("posts nothing when the confirmation is for an unknown viewport or request", async () => {
      const t = await twoViewports();
      t.client.createLink();
      t.discard();
      const success = {
        type: "CREATE_VISUAL_LINK_SUCCESS",
        childVpId: "server-vp-2",
        parentVpId: "server-vp-1",
        childColumnName: "col-1",
        parentColumnName: "col-1",
      };

      t.server.receives({ ...success, childVpId: "server-vp-9" }, "req1");
      t.expectClient();
      t.server.receives({ ...success, parentVpId: "server-vp-9" }, "req1");
      t.expectClient();
      // no pending operation for this request id
      t.server.receives(success, "req-unknown");
      t.expectClient();
    });
  });

  describe("REMOVE_VISUAL_LINK", () => {
    it("sends REMOVE_VISUAL_LINK for the child's server viewport", async () => {
      const t = await twoViewports();
      t.client.removeLink();
      t.expectClient();
      t.expectServer(
        serverRequest(
          { type: "REMOVE_VISUAL_LINK", childVpId: "server-vp-2" },
          "req2",
        ),
      );
    });

    it("posts vuu-link-removed when the server confirms", async () => {
      const t = await twoViewports();
      t.client.removeLink();
      t.discard();

      t.server.replies("REMOVE_VISUAL_LINK", {
        type: "REMOVE_VISUAL_LINK_SUCCESS",
        childVpId: "server-vp-2",
      });
      t.expectClient({
        requestId: "req2",
        type: "vuu-link-removed",
        clientViewportId: "client-vp-2",
      });
    });

    it("posts nothing when the confirmation is for an unknown viewport", async () => {
      const t = await twoViewports();
      t.client.removeLink();
      t.discard();
      t.server.receives(
        { type: "REMOVE_VISUAL_LINK_SUCCESS", childVpId: "server-vp-9" },
        "req2",
      );
      t.expectClient();
    });
  });

  describe("setTitle", () => {
    it("stores the title on the viewport", async () => {
      const t = await serverProxyHarness();
      t.client.setTitle("Orders");
      expect(t.viewportState().title).toEqual("Orders");
      t.expectClient();
      t.expectServer();
    });

    it("relabels links on child viewports that link to it", async () => {
      const t = await twoViewports();
      t.server.receives(linksResponse("server-vp-2", [linkTo("server-vp-1")]));
      t.discard();

      t.client.setTitle("Orders", "client-vp-1");
      t.expectClient(
        vuuLinks("client-vp-2", [
          {
            ...linkTo("server-vp-1"),
            parentClientVpId: "client-vp-1",
            label: "Orders",
          },
        ]),
      );
    });

    it("does not relabel links when the title is empty", async () => {
      const t = await twoViewports();
      t.server.receives(linksResponse("server-vp-2", [linkTo("server-vp-1")]));
      t.discard();

      t.client.setTitle("", "client-vp-1");
      t.expectClient();
    });

    it("does not post links of a viewport that does not link to it", async () => {
      const t = await twoViewports();
      t.server.receives(linksResponse("server-vp-2", [linkTo("server-vp-1")]));
      t.discard();

      // client-vp-2 is not a parent of anything
      t.client.setTitle("Fills", "client-vp-2");
      t.expectClient();
    });
  });

  describe("REMOVE_VP_SUCCESS", () => {
    it("removes the viewport and the links that point at it", async () => {
      const t = await twoViewports();
      t.server.receives(linksResponse("server-vp-2", [linkTo("server-vp-1")]));
      t.discard();

      t.client.unsubscribe("client-vp-1");
      t.expectServer(
        serverRequest({ type: "REMOVE_VP", viewPortId: "server-vp-1" }),
      );

      t.server.replies("REMOVE_VP", {
        type: "REMOVE_VP_SUCCESS",
        viewPortId: "server-vp-1",
      });
      t.expectClient(vuuLinks("client-vp-2", []));
      expect(t.viewportState("server-vp-2").links).toEqual([]);
      const proxy = t.proxyState();
      expect(proxy.viewportCount).toEqual(1);
      expect(proxy.serverViewportFor("client-vp-1")).toBeUndefined();
    });
  });

  describe("subscribe", () => {
    it("re-requests links for other subscribed viewports when a new viewport subscribes", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });

      t.expectClient(subscribedMessage({ range: [0, 10], vp: "client-vp-2" }));
      // the table meta request is cached from the first subscription
      t.expectServer(
        serverRequest(createVpBody({ range: [0, 10] }), "client-vp-2"),
        serverRequest({ type: "GET_VP_VISUAL_LINKS", vpId: "server-vp-2" }),
        serverRequest({ type: "GET_VIEW_PORT_MENUS", vpId: "server-vp-2" }),
        serverRequest({ type: "GET_VP_VISUAL_LINKS", vpId: "server-vp-1" }),
      );
    });

    it("does not re-request links for a disabled viewport", async () => {
      const t = await serverProxyHarness();
      t.client.disable();
      t.server.acks("DISABLE_VP");
      t.discard();

      await t.subscribe({ key: "2" });
      t.expectServer(
        serverRequest(createVpBody({ range: [0, 10] }), "client-vp-2"),
        serverRequest({ type: "GET_VP_VISUAL_LINKS", vpId: "server-vp-2" }),
        serverRequest({ type: "GET_VIEW_PORT_MENUS", vpId: "server-vp-2" }),
      );
    });
  });
});
