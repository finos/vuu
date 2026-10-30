import {
  GridLayout,
  type GridLayoutDocument,
  GridLayoutProvider,
} from "@heswell/grid-layout";
import {
  panelComponent,
  showcaseDocument,
  showcaseGridComponentRenderers,
  showcaseGridSettingsCodecs,
} from "../GridLayout/GridLayoutPersistenceFixtures";
import "./GridLayout.examples.css";

const twoByTwoDocument = showcaseDocument({
  components: [
    panelComponent("green-component", "Green", "green"),
    panelComponent("blue-component", "Blue", "blue"),
    panelComponent("red-component", "Red", "red"),
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr", "1fr"],
    id: "grid-1",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "green-component",
        header: true,
        id: "green",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Green",
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "blue-component",
        header: true,
        id: "blue",
        resizeable: "hv",
        row: { span: 2, start: 1 },
        title: "Blue",
      },
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "red-component",
        header: true,
        id: "red",
        resizeable: "hv",
        row: { span: 1, start: 2 },
        title: "Red",
      },
    ],
    placeholderIds: [],
    rows: ["1fr", "1fr"],
    stacks: [],
  },
  version: 2,
});

const stackedDocument = showcaseDocument({
  components: [
    panelComponent("green", "Green", "green"),
    panelComponent("blue", "Blue", "blue"),
    panelComponent("red", "Red", "red"),
    panelComponent("yellow", "Yellow", "yellow", "black"),
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr"],
    id: "grid-1",
    items: [
      {
        column: { span: 1, start: 1 },
        header: true,
        id: "green",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Green",
      },
      {
        column: { span: 1, start: 1 },
        header: true,
        id: "blue",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Blue",
      },
      {
        column: { span: 1, start: 1 },
        header: true,
        id: "red",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Red",
      },
      {
        column: { span: 1, start: 1 },
        header: true,
        id: "yellow",
        resizeable: "hv",
        row: { span: 1, start: 2 },
        title: "Yellow",
      },
    ],
    placeholderIds: [],
    rows: ["1fr", "1fr"],
    stacks: [
      {
        id: "tabs-1",
        itemIds: ["green", "blue", "red"],
        selectedItemId: "red",
      },
    ],
  },
  version: 2,
});

const layoutFromJsonDocument = showcaseDocument({
  components: twoByTwoDocument.components,
  kind: "grid-layout",
  layout: {
    columns: ["1fr", "1fr"],
    id: "grid-layout-from-json",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "red-component",
        header: true,
        id: "red",
        row: { span: 1, start: 1 },
        title: "Red",
      },
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "green-component",
        header: true,
        id: "green",
        row: { span: 1, start: 2 },
        title: "Green",
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "blue-component",
        header: true,
        id: "blue",
        row: { span: 2, start: 1 },
        title: "Blue",
      },
    ],
    placeholderIds: [],
    rows: ["1fr", "1fr"],
    stacks: [],
  },
  version: 2,
});

const PersistedGrid = ({ document }: { document: GridLayoutDocument }) => (
  <GridLayoutProvider
    componentRenderers={showcaseGridComponentRenderers}
    document={document}
    settingsCodecs={showcaseGridSettingsCodecs}
  >
    <GridLayout full-page id={document.layout.id} />
  </GridLayoutProvider>
);

export const TwoByTwoDoubleRowspanInColumnTwoDeserialized = () => (
  <PersistedGrid document={twoByTwoDocument} />
);

export const SingleStackDeserialized = () => (
  <PersistedGrid document={stackedDocument} />
);

export const GridLayoutFromJSON = () => (
  <PersistedGrid document={layoutFromJsonDocument} />
);
