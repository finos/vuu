import {
  LayoutContainer,
  Flexbox,
  LayoutChangeHandler,
  LayoutProvider,
} from "@finos/vuu-layout";
import {
  LayoutJSON,
  VuuShellLocation,
  registerComponent,
} from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { useCallback, useState } from "react";
import VuuFilterTableFeature from "feature-vuu-filter-table";

import { schemas } from "@finos/vuu-data-test";
import { LocalDataSourceProvider } from "@finos/vuu-data-test/src/local-datasource-provider/LocalDatasourceProvider";

registerComponent("FilterTable", VuuFilterTableFeature, "view");

let displaySequence = 1;

const contentRed = {
  type: "div",
  props: {
    style: { backgroundColor: "red", height: "100%" },
  },
};
const contentYellow = {
  type: "div",
  props: {
    style: { backgroundColor: "yellow", height: "100%" },
  },
};
const contentBlue = {
  type: "div",
  props: {
    style: { backgroundColor: "blue", height: "100%" },
  },
};

export const StaticTemplateNoChrome = () => {
  const handleLayoutChange = useCallback<LayoutChangeHandler>((layout) => {
    console.log({ layout });
  }, []);

  const [layout, setLayout] = useState<LayoutJSON>();
  const showRedContent = () => setLayout(contentRed);
  const showYellowContent = () => setLayout(contentYellow);
  const showBlueContent = () => setLayout(contentBlue);

  console.log(JSON.stringify(layout));

  return (
    <>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "var(--salt-spacing-100)",
          height: 60,
          padding: "0 var(--salt-spacing-100)",
        }}
      >
        <Button onClick={showRedContent}>Red content</Button>
        <Button onClick={showYellowContent}>Yellow content</Button>
        <Button onClick={showBlueContent}>Blue content</Button>
      </div>
      <LayoutProvider
        onLayoutChange={handleLayoutChange}
        workspaceJSON={layout}
      >
        <LayoutContainer
          dropTarget
          id={VuuShellLocation.WorkspaceContainer}
          style={{
            inset: "60px 0 0 0",
            position: "absolute",
          }}
        >
          <div style={{ backgroundColor: "green", height: "100%" }} />
        </LayoutContainer>
      </LayoutProvider>
    </>
  );
};
StaticTemplateNoChrome.displaySequence = displaySequence++;

export const LeftRightChrome = () => {
  const handleLayoutChange = useCallback<LayoutChangeHandler>((layout) => {
    console.log({ layout });
  }, []);

  const [layout, setLayout] = useState<LayoutJSON>();
  const showRedContent = () => setLayout(contentRed);
  const showYellowContent = () => setLayout(contentYellow);
  const showBlueContent = () => setLayout(contentBlue);

  return (
    <>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "var(--salt-spacing-100)",
          height: 60,
          padding: "0 var(--salt-spacing-100)",
        }}
      >
        <Button onClick={showRedContent}>Red content</Button>
        <Button onClick={showYellowContent}>Yellow content</Button>
        <Button onClick={showBlueContent}>Blue content</Button>
      </div>
      <LayoutProvider
        onLayoutChange={handleLayoutChange}
        workspaceJSON={layout}
      >
        <LayoutContainer
          style={{
            inset: "60px 0 0 0",
            position: "absolute",
          }}
        >
          <Flexbox
            className="App"
            style={{
              flexDirection: "row",
              height: "100%",
              width: "100%",
            }}
          >
            <div style={{ backgroundColor: "gray", width: 100 }} />
            <LayoutContainer
              className="the-goat"
              id={VuuShellLocation.WorkspaceContainer}
              key="main-content"
              style={{ flex: 1 }}
            >
              <div style={{ backgroundColor: "green", height: "100%" }} />
            </LayoutContainer>
            <div style={{ backgroundColor: "gray", width: 100 }} />
          </Flexbox>
        </LayoutContainer>
      </LayoutProvider>
    </>
  );
};
LeftRightChrome.displaySequence = displaySequence++;

const LayoutProviderTemplate = ({
  workspaceJSON,
}: {
  workspaceJSON: LayoutJSON;
}) => (
  <LayoutProvider workspaceJSON={workspaceJSON}>
    <LayoutContainer
      dropTarget
      id={VuuShellLocation.WorkspaceContainer}
      style={{
        inset: 0,
        position: "absolute",
      }}
    />
  </LayoutProvider>
);

export const SimpleStaticLayoutJson = () => (
  <LayoutProviderTemplate
    workspaceJSON={{
      type: "Flexbox",
      props: {
        style: { flexDirection: "column", height: "100%" },
      },
      children: [
        { type: "div", props: { style: { background: "blue", flex: 1 } } },
        { type: "div", props: { style: { background: "yellow", flex: 1 } } },
      ],
    }}
  />
);

SimpleStaticLayoutJson.displaySequence = displaySequence++;

export const SimpleStaticLayoutJsonWithViews = () => (
  <LayoutProviderTemplate
    workspaceJSON={{
      type: "Flexbox",
      props: {
        style: { flexDirection: "column", height: "100%" },
      },
      children: [
        {
          type: "View",
          props: {
            header: TransformStreamDefaultController,
            style: { flex: 1 },
            title: "Blue Hawaii",
          },
          children: [
            {
              type: "div",
              props: {
                style: { background: "blue", margin: 4 },
              },
            },
          ],
        },
        {
          type: "View",
          props: {
            header: TransformStreamDefaultController,
            style: { flex: 1 },
            title: "Yellow Submarine",
          },
          children: [
            {
              type: "div",
              props: { style: { background: "yellow", margin: 4 } },
            },
          ],
        },
      ],
    }}
  />
);

SimpleStaticLayoutJsonWithViews.displaySequence = displaySequence++;

export const LayoutJsonWithPreloadedFeatures = () => (
  <LocalDataSourceProvider modules={["BASKET"]}>
    <LayoutProviderTemplate
      workspaceJSON={{
        type: "Flexbox",
        props: {
          style: { flexDirection: "column", height: "100%" },
        },
        children: [
          {
            type: "View",
            props: {
              header: TransformStreamDefaultController,
              resizeable: true,
              style: { flex: 1 },
              title: "Basket",
            },
            children: [
              {
                type: "FilterTable",
                props: {
                  style: { margin: 4 },
                  tableSchema: schemas.basket,
                },
              },
            ],
          },
          {
            type: "View",
            props: {
              header: TransformStreamDefaultController,
              resizeable: true,
              style: { flex: 1 },
              title: "Basket Constituents",
            },
            children: [
              {
                type: "FilterTable",
                props: {
                  style: { margin: 4 },
                  tableSchema: schemas.basketConstituent,
                },
              },
            ],
          },
        ],
      }}
    />
  </LocalDataSourceProvider>
);

LayoutJsonWithPreloadedFeatures.displaySequence = displaySequence++;

export const LayoutJsonWithPreloadedFeaturesVisualLinks = () => (
  <LocalDataSourceProvider modules={["BASKET"]}>
    <LayoutProviderTemplate
      workspaceJSON={{
        type: "Flexbox",
        props: {
          style: { flexDirection: "column", height: "100%" },
        },
        children: [
          {
            id: "view-basket",
            type: "View",
            props: {
              header: TransformStreamDefaultController,
              resizeable: true,
              style: { flex: 1 },
              title: "Basket",
            },
            children: [
              {
                type: "FilterTable",
                props: {
                  style: { margin: 4 },
                  tableSchema: schemas.basket,
                },
              },
            ],
          },
          {
            id: "view-basket-constituent",
            type: "View",
            props: {
              header: TransformStreamDefaultController,
              resizeable: true,
              style: { flex: 1 },
              title: "Basket Constituents",
            },
            children: [
              {
                type: "FilterTable",
                props: {
                  style: { margin: 4 },
                  tableSchema: schemas.basketConstituent,
                },
              },
            ],
            state: {
              "datasource-config": {
                visualLink: {
                  label: "Basket",
                  link: {
                    fromColumn: "basketId",
                    toColumn: "id",
                    toTable: "basket",
                  },
                  parentClientVpId: "view-basket",
                  parentVpId: "view-basket",
                },
              },
            },
          },
        ],
      }}
    />
  </LocalDataSourceProvider>
);

LayoutJsonWithPreloadedFeaturesVisualLinks.displaySequence = displaySequence++;
