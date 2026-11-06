import { type GridLayoutSplitDirection, queryClosest } from "@vuu-ui/vuu-utils";
import {
  type DragEvent as ReactDragEvent,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import {
  type GridComponentSettingsCodec,
  type GridComponentSettingsUpdater,
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  type GridController,
  GridDragCoordinator,
  type GridDragSource,
  type GridDropTarget,
  GridLayout,
  type GridLayoutCommands,
  type GridLayoutDocument,
  type GridLayoutDocumentChange,
  GridLayoutDocumentController,
  GridLayoutItem,
  GridLayoutProvider,
  GridLayoutStackedItem,
  type SerializedGridLayout,
  type TemplateDragState,
  type TemplateSource,
  type TypedComponentTemplate,
  useDraggable,
  useGridComponentSettingsUpdater,
  useGridController,
  useGridLayoutCommands,
  useGridLayoutDispatch,
  useGridLayoutDragStartHandler,
  useGridLayoutHistory,
  useGridModel,
  useTemplateDragState,
} from "../..";
import { useGridLayoutDropHandler } from "../../GridLayoutContext";

/**
 * Fixtures for GridLayout behaviour driven by a GridLayoutDocument. Gallery
 * props must be serializable, so each fixture publishes a test harness on
 * `window.gridTest`. Tests use it to issue commands and read what the
 * provider published.
 */

export type GridLayoutDocumentFixtureVariant =
  | "class-name"
  | "commands"
  | "commands-empty"
  | "commands-outside-provider"
  | "document-change"
  | "existing-item"
  | "legacy-serialized-layout"
  | "load-replace"
  | "migration"
  | "nested-controllers"
  | "persistence-children"
  | "persistence-document"
  | "remountable-stack"
  | "history"
  | "settings"
  | "settings-outside-provider"
  | "stack-splitter-east"
  | "stack-splitter-south"
  | "template-drag-state";

export interface RecordedDocumentChange {
  document: GridLayoutDocument;
  kind: GridLayoutDocumentChange["kind"];
  removedComponentInstanceIds: readonly string[];
  revision: number;
  /** change.document is the document passed as the first argument */
  sameDocument: boolean;
}

export interface CoordinatorDragResult {
  begin: boolean;
  commit: boolean;
  preview: boolean;
  /** onDocumentChange calls made before the commit */
  writesBeforeCommit: number;
}

export interface GridTestHarness {
  commands?: GridLayoutCommands;
  controllers: Record<string, GridController>;
  /** drags through GridDragCoordinator, without DOM events */
  coordinatorDrag: (
    gridId: string,
    source: GridDragSource,
    target: Omit<GridDropTarget, "gridId">,
  ) => CoordinatorDragResult;
  /** values a test keeps between page.evaluate calls */
  saved: Record<string, unknown>;
  documentController?: GridLayoutDocumentController;
  /** the most recent document passed to onDocumentChange, by reference */
  lastDocument?: GridLayoutDocument;
  errors: string[];
  nestedDragStates: TemplateDragState[];
  setDocument?: (document: unknown) => void;
  setRenderers?: (renderers: "default" | "empty") => void;
  shellDragStates: TemplateDragState[];
  updater?: GridComponentSettingsUpdater;
  writes: RecordedDocumentChange[];
}

declare global {
  interface Window {
    gridTest: GridTestHarness;
  }
}

const createHarness = (): GridTestHarness => {
  const gridTest: GridTestHarness = {
    controllers: {},
    coordinatorDrag: (gridId, source, target) => {
      const controller = gridTest.controllers[gridId];
      if (!controller) {
        throw Error(`no controller captured for ${gridId}`);
      }
      const coordinator = new GridDragCoordinator(gridId, controller);
      const begin = coordinator.begin(source).ok;
      const preview = coordinator.preview({ ...target, gridId }).ok;
      const writesBeforeCommit = gridTest.writes.length;
      const commit = coordinator.commit().ok;
      return { begin, commit, preview, writesBeforeCommit };
    },
    errors: [],
    nestedDragStates: [],
    saved: {},
    shellDragStates: [],
    writes: [],
  };
  return gridTest;
};

const harness = () => window.gridTest;

const recordChange = (
  document: GridLayoutDocument,
  change: GridLayoutDocumentChange,
) => {
  const gridTest = harness();
  gridTest.lastDocument = document;
  gridTest.writes.push({
    document: JSON.parse(JSON.stringify(document)),
    kind: change.kind,
    removedComponentInstanceIds: [...change.removedComponentInstanceIds],
    revision: change.revision,
    sameDocument: change.document === document,
  });
};

const recordError = ({ code }: { code: string }) => {
  harness().errors.push(code);
};

/* Label components ---------------------------------------------------- */

interface LabelSettings {
  readonly label: string;
}

const isLabelSettings = (value: unknown): value is LabelSettings =>
  typeof value === "object" &&
  value !== null &&
  "label" in value &&
  typeof value.label === "string";

const decodeLabel: GridComponentSettingsCodec<LabelSettings>["decode"] = (
  value,
) =>
  isLabelSettings(value)
    ? { ok: true, value }
    : {
        error: {
          code: "INVALID_LABEL",
          message: "label must be a string",
          path: "$.label",
        },
        ok: false,
      };

const codecs = new GridComponentSettingsRegistry();
codecs.register("label", {
  decode: decodeLabel,
  encode: (value) => ({ ok: true, value }),
  isSettings: isLabelSettings,
  version: 1,
});

/** Version 2 label codec whose migration from version 1 always fails */
const migrationCodecs = new GridComponentSettingsRegistry();
migrationCodecs.register("label", {
  decode: decodeLabel,
  encode: (value) => ({ ok: true, value }),
  isSettings: isLabelSettings,
  migrations: {
    1: () => ({
      error: {
        code: "INVALID_V1_LABEL",
        message: "legacy text must be a string",
        path: "$.text",
      },
      ok: false,
    }),
  },
  version: 2,
});

/** Records the controller of the grid it renders in, keyed by grid id */
const ControllerCapture = ({ gridId }: { gridId: string }) => {
  harness().controllers[gridId] = useGridController();
  return null;
};

const CommandsCapture = () => {
  harness().commands = useGridLayoutCommands();
  return null;
};

const HistoryToolbar = () => {
  const { canRedo, canUndo, redo, undo } = useGridLayoutHistory();
  return (
    <div>
      <button disabled={!canUndo} onClick={undo} type="button">
        Undo
      </button>
      <button disabled={!canRedo} onClick={redo} type="button">
        Redo
      </button>
    </div>
  );
};

const UpdaterCapture = () => {
  harness().updater = useGridComponentSettingsUpdater();
  return null;
};

const Label = ({
  gridId,
  id,
  label,
}: LabelSettings & { gridId: string; id: string }) => (
  <>
    <ControllerCapture gridId={gridId} />
    <UpdaterCapture />
    <span data-component-id={id} data-label={label} id={`label-${id}`}>
      {label}
    </span>
  </>
);

const labelRenderers = (gridId: string) => {
  const registry = new GridComponentRendererRegistry();
  registry.register("label", isLabelSettings, ({ label }, id) => (
    <Label gridId={gridId} id={id} label={label} />
  ));
  return registry;
};

/* Documents ----------------------------------------------------------- */

const component = (id: string, label: string, version = 1) => ({
  id,
  settings: { label },
  type: "label",
  version,
});

const item = (id: string, title: string, columnStart: number) => ({
  column: { span: 1, start: columnStart },
  componentInstanceId: `component-${id}`,
  dropTarget: true,
  header: true,
  id,
  resizeable: "hv" as const,
  row: { span: 1, start: 1 },
  title,
});

/** Column 1: standalone "solo". Column 2: stack "stack-1" of the tabs */
const stackDocument = (
  gridId: string,
  tabs: readonly string[],
): GridLayoutDocument => ({
  components: [
    component("component-solo", "Solo"),
    ...tabs.map((tab) => component(`component-tab-${tab}`, `Tab ${tab}`)),
  ],
  kind: "grid-layout",
  layout: {
    columns: ["300px", "300px"],
    id: gridId,
    items: [
      item("solo", "Solo", 1),
      ...tabs.map((tab) => item(`tab-${tab}`, `Tab ${tab}`, 2)),
    ],
    placeholderIds: [],
    rows: ["300px"],
    stacks: [
      {
        id: "stack-1",
        itemIds: tabs.map((tab) => `tab-${tab}`),
        selectedItemId: `tab-${tabs[0]}`,
      },
    ],
  },
  version: 2,
});

const emptyDocument = (gridId: string): GridLayoutDocument => ({
  components: [],
  kind: "grid-layout",
  layout: {
    columns: ["300px"],
    id: gridId,
    items: [
      {
        column: { span: 1, start: 1 },
        id: "placeholder-1",
        row: { span: 1, start: 1 },
      },
    ],
    placeholderIds: ["placeholder-1"],
    rows: ["300px"],
    stacks: [],
  },
  version: 2,
});

/** A single item whose item id and component id are the same */
export const singleLabelDocument = (
  gridId: string,
  componentId: string,
  label: string,
  version = 1,
): GridLayoutDocument => ({
  components: [component(componentId, label, version)],
  kind: "grid-layout",
  layout: {
    columns: ["300px"],
    id: gridId,
    items: [
      {
        column: { span: 1, start: 1 },
        id: componentId,
        row: { span: 1, start: 1 },
      },
    ],
    placeholderIds: [],
    rows: ["300px"],
    stacks: [],
  },
  version: 2,
});

/** Two items whose item ids differ from their component ids */
const interactiveDocument = (gridId: string): GridLayoutDocument => ({
  components: [
    component("component-alpha", "Alpha"),
    component("component-beta", "Beta"),
  ],
  kind: "grid-layout",
  layout: {
    columns: ["200px", "200px"],
    id: gridId,
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "component-alpha",
        header: true,
        id: "item-alpha",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Alpha",
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "component-beta",
        header: true,
        id: "item-beta",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Beta",
      },
    ],
    placeholderIds: [],
    rows: ["300px"],
    stacks: [],
  },
  version: 2,
});

const settingsDocument = (gridId: string): GridLayoutDocument => ({
  components: [component("component-a", "A"), component("component-b", "B")],
  kind: "grid-layout",
  layout: {
    columns: ["200px", "200px"],
    id: gridId,
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "component-a",
        id: "a",
        row: { span: 1, start: 1 },
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "component-b",
        id: "b",
        row: { span: 1, start: 1 },
      },
    ],
    placeholderIds: [],
    rows: ["300px"],
    stacks: [],
  },
  version: 2,
});

const legacyLayout: SerializedGridLayout = {
  components: {
    green: {
      props: { children: "Legacy green" },
      type: "div",
    },
  },
  id: "legacy-grid",
  layout: {
    cols: ["300px"],
    gridLayoutItems: {
      green: {
        gridArea: "1/1/2/2",
        header: true,
        resizeable: "hv",
        title: "Green",
      },
    },
    rows: ["300px"],
  },
};

/* Document driven fixtures -------------------------------------------- */

/**
 * A GridLayoutProvider whose document and renderers a test can replace
 * through the harness.
 */
const DocumentGrid = ({
  documentController,
  gridId,
  initialDocument,
  settingsCodecs = codecs,
  children,
}: {
  children?: ReactNode;
  documentController?: GridLayoutDocumentController;
  gridId: string;
  initialDocument: unknown;
  settingsCodecs?: GridComponentSettingsRegistry;
}) => {
  const [document, setDocument] = useState(initialDocument);
  const [renderers, setRenderers] = useState(() => labelRenderers(gridId));
  const gridTest = harness();
  gridTest.setDocument = setDocument;
  gridTest.setRenderers = (name) =>
    setRenderers(
      name === "empty"
        ? new GridComponentRendererRegistry()
        : labelRenderers(gridId),
    );
  return (
    <GridLayoutProvider
      componentRenderers={renderers}
      document={document}
      documentController={documentController}
      onDocumentChange={recordChange}
      onDocumentError={recordError}
      settingsCodecs={settingsCodecs}
    >
      <GridLayout id={gridId} style={{ height: 320, width: 640 }} />
      {children}
    </GridLayoutProvider>
  );
};

const PersistenceDocumentFixture = () => {
  const [documentController] = useState(() => {
    const controller = new GridLayoutDocumentController();
    harness().documentController = controller;
    return controller;
  });
  return (
    <DocumentGrid
      documentController={documentController}
      gridId="interactive-grid"
      initialDocument={interactiveDocument("interactive-grid")}
    />
  );
};

const SettingsFixture = () => {
  const [documentController] = useState(() => {
    const controller = new GridLayoutDocumentController();
    harness().documentController = controller;
    return controller;
  });
  return (
    <DocumentGrid
      documentController={documentController}
      gridId="settings-grid"
      initialDocument={settingsDocument("settings-grid")}
    />
  );
};

/** Children-based layout with typed componentSettings */
const PersistenceChildrenFixture = () => (
  <GridLayoutProvider
    componentSettings={[
      { id: "left", settings: { label: "Left" }, type: "label" },
      { id: "right", settings: { label: "Right" }, type: "label" },
    ]}
    onDocumentChange={recordChange}
    settingsCodecs={codecs}
  >
    <GridLayout
      colsAndRows={{ cols: ["200px", "200px"], rows: ["300px"] }}
      id="persisted-grid"
      style={{ height: 320, width: 640 }}
    >
      <GridLayoutItem
        header
        id="left"
        style={{ gridArea: "1/1/2/2" }}
        title="Left"
      >
        <ControllerCapture gridId="persisted-grid" />
        Left
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="right"
        style={{ gridArea: "1/2/2/3" }}
        title="Right"
      >
        Right
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

const LegacySerializedLayoutFixture = () => (
  <GridLayoutProvider
    componentSettings={[
      { id: "green", settings: { label: "Green" }, type: "label" },
    ]}
    onDocumentChange={recordChange}
    serializedLayout={legacyLayout}
    settingsCodecs={codecs}
  >
    <GridLayout id="legacy-grid" style={{ height: 320, width: 640 }} />
  </GridLayoutProvider>
);

/* Drag fixtures ------------------------------------------------------- */

const TwoItemLayout = ({ gridId }: { gridId: string }) => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols: ["300px", "300px"], rows: ["300px"] }}
      id={gridId}
      style={{ height: 320, width: 640 }}
    >
      <GridLayoutItem
        data-drop-target
        header
        id="source"
        resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        title="Source"
      >
        <div>Source content</div>
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="target"
        resizeable="hv"
        style={{ gridArea: "1/2/2/3" }}
        title="Target"
      >
        <div>Target content</div>
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

const typedTemplate: TypedComponentTemplate = {
  component: {
    settings: { label: "Typed template" },
    type: "label",
    version: 1,
  },
  label: "Typed template",
};

const TypedTemplatePalette = () => {
  const onDragStart = useGridLayoutDragStartHandler();
  const getDragSource = useCallback(
    (event: ReactDragEvent<Element>): TemplateSource => {
      const element = queryClosest(
        event.target,
        "[data-testid='typed-palette-item']",
        true,
      );
      const layout = queryClosest(element, ".vuuGridLayout", true);
      return {
        ...typedTemplate,
        element,
        layoutId: layout.id,
        type: "template",
      };
    },
    [],
  );
  const draggable = useDraggable({ getDragSource, onDragStart });
  return (
    <button
      data-testid="typed-palette-item"
      draggable
      type="button"
      {...draggable}
    >
      Typed template
    </button>
  );
};

/**
 * Records every render of useTemplateDragState, so tests can check that
 * pointer moves during a drag do not re-render.
 */
const TemplateDragStateObserver = ({
  scope,
}: {
  scope: "nested" | "shell";
}) => {
  const state = useTemplateDragState();
  const gridTest = harness();
  (scope === "shell"
    ? gridTest.shellDragStates
    : gridTest.nestedDragStates
  ).push(state);
  return (
    <div data-dragging={state.dragging} data-testid={`drag-state-${scope}`}>
      {state.template?.label ?? ""}
    </div>
  );
};

const TemplateDragStateFixture = () => {
  const [renderers] = useState(() => labelRenderers("workspace-grid"));
  return (
    <GridLayoutProvider>
      <TemplateDragStateObserver scope="shell" />
      <GridLayout
        colsAndRows={{ cols: ["160px", "400px"], rows: ["300px"] }}
        id="static-shell"
        style={{ height: 320, width: 640 }}
      >
        <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
          <TypedTemplatePalette />
        </GridLayoutItem>
        <GridLayoutItem id="workspace-owner" style={{ gridArea: "1/2/2/3" }}>
          <GridLayoutProvider
            componentRenderers={renderers}
            componentSettings={[
              {
                id: "workspace-target",
                settings: { label: "Target" },
                type: "label",
              },
            ]}
            onDocumentChange={recordChange}
            settingsCodecs={codecs}
          >
            <TemplateDragStateObserver scope="nested" />
            <GridLayout
              colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
              id="workspace-grid"
            >
              <GridLayoutItem
                data-drop-target
                header
                id="workspace-target"
                resizeable="hv"
                style={{ gridArea: "1/1/2/2" }}
                title="Target"
              >
                <span>Target</span>
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutProvider>
        </GridLayoutItem>
      </GridLayout>
    </GridLayoutProvider>
  );
};

/* Snapshot fixtures --------------------------------------------------- */

const NestedControllersFixture = () => (
  <GridLayout
    colsAndRows={{ cols: ["300px", "300px"], rows: ["300px"] }}
    id="parent-grid"
    style={{ height: 320, width: 640 }}
  >
    <GridLayoutItem id="nested-owner" style={{ gridArea: "1/1/2/2" }}>
      <ControllerCapture gridId="parent-grid" />
      <GridLayout
        colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
        id="child-grid"
      >
        <GridLayoutItem id="child" style={{ gridArea: "1/1/2/2" }}>
          <ControllerCapture gridId="child-grid" />
          Child
        </GridLayoutItem>
      </GridLayout>
    </GridLayoutItem>
    <GridLayoutItem id="peer" style={{ gridArea: "1/2/2/3" }}>
      Peer
    </GridLayoutItem>
  </GridLayout>
);

const CloseSecondButton = () => {
  const dispatch = useGridLayoutDispatch();
  return (
    <button
      data-testid="close-second"
      onClick={() => dispatch({ id: "second", type: "close" })}
      type="button"
    >
      Close second
    </button>
  );
};

const RemountableStackFixture = () => {
  const [mounted, setMounted] = useState(true);
  return (
    <GridLayoutProvider>
      <button
        data-testid="toggle-stack"
        onClick={() => setMounted((value) => !value)}
        type="button"
      >
        Toggle
      </button>
      {mounted ? (
        <GridLayout
          colsAndRows={{ cols: ["300px"], rows: ["300px"] }}
          id="persisted-stack"
          style={{ height: 320, width: 640 }}
        >
          <GridLayoutStackedItem
            id="persisted-tabs"
            style={{ gridArea: "1/1/2/2" }}
          />
          <GridLayoutItem
            contentVisible
            id="first"
            stackId="persisted-tabs"
            title="First"
          >
            <CloseSecondButton />
          </GridLayoutItem>
          <GridLayoutItem
            contentVisible={false}
            id="second"
            stackId="persisted-tabs"
            title="Second"
          >
            Second
          </GridLayoutItem>
        </GridLayout>
      ) : null}
    </GridLayoutProvider>
  );
};

/* Stack splitter fixture ---------------------------------------------- */

const htmlTemplate = (label: string): TemplateSource => ({
  componentJson: JSON.stringify({
    label,
    props: { children: label },
    type: "div",
  }),
  element: document.createElement("button"),
  label,
  layoutId: "stack-splitter-grid",
  type: "template",
});

/**
 * Buttons that split a "Teal" template off the target, then stack a
 * "Coral" template onto it, without dragging.
 */
const StackSplitterControls = ({
  splitDirection,
}: {
  splitDirection: GridLayoutSplitDirection;
}) => {
  const drop = useGridLayoutDropHandler();
  const dispatch = useGridLayoutDispatch();
  const gridModel = useGridModel();
  const itemTitled = (title: string) => {
    const childItem = gridModel.childItems.find(
      (candidate) => candidate.title === title,
    );
    if (!childItem) {
      throw Error(`${title} item not found`);
    }
    return childItem;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        data-testid="split-template"
        onClick={() => drop("target", htmlTemplate("Teal"), splitDirection)}
        type="button"
      >
        Split
      </button>
      <button
        data-testid="stack-template"
        onClick={() =>
          drop(itemTitled("Teal").id, htmlTemplate("Coral"), "header")
        }
        type="button"
      >
        Stack
      </button>
      <button
        data-testid="dissolve-stack"
        onClick={() => dispatch({ id: itemTitled("Coral").id, type: "close" })}
        type="button"
      >
        Dissolve
      </button>
    </div>
  );
};

const StackSplitterFixture = ({
  splitDirection,
}: {
  splitDirection: GridLayoutSplitDirection;
}) => (
  <GridLayoutProvider options={{ newChildItem: { header: true } }}>
    <GridLayout
      colsAndRows={{ cols: ["140px", "400px"], rows: ["300px"] }}
      id="stack-splitter-grid"
      style={{ height: 320, width: 640 }}
    >
      <GridLayoutItem id="palette" style={{ gridArea: "1/1/2/2" }}>
        <StackSplitterControls splitDirection={splitDirection} />
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="target"
        resizeable="hv"
        style={{ gridArea: "1/2/2/3" }}
        title="Drop target"
      >
        <div>Drop target</div>
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

const ClassNameFixture = () => (
  <GridLayoutProvider>
    <GridLayout
      colsAndRows={{ cols: ["300px"], rows: ["300px"] }}
      id="class-name-grid"
      style={{ height: 320, width: 640 }}
    >
      <GridLayoutItem
        className="workspace-panel"
        header
        id="item"
        style={{ gridArea: "1/1/2/2" }}
        title="Item"
      >
        <div>Content</div>
      </GridLayoutItem>
    </GridLayout>
  </GridLayoutProvider>
);

/* Fixture ------------------------------------------------------------- */

const renderVariant = (variant: GridLayoutDocumentFixtureVariant) => {
  switch (variant) {
    case "class-name":
      return <ClassNameFixture />;
    case "history":
      return (
        <DocumentGrid
          gridId="history-grid"
          initialDocument={stackDocument("history-grid", ["a", "b"])}
        >
          <CommandsCapture />
          <HistoryToolbar />
        </DocumentGrid>
      );
    case "commands":
      return (
        <DocumentGrid
          gridId="commands-grid"
          initialDocument={stackDocument("commands-grid", ["a", "b"])}
        >
          <CommandsCapture />
        </DocumentGrid>
      );
    case "commands-empty":
      return (
        <DocumentGrid
          gridId="commands-grid"
          initialDocument={emptyDocument("commands-grid")}
        >
          <CommandsCapture />
        </DocumentGrid>
      );
    case "commands-outside-provider":
      return <CommandsCapture />;
    case "document-change":
      return (
        <DocumentGrid
          gridId="change-grid"
          initialDocument={stackDocument("change-grid", ["a", "b", "c"])}
        />
      );
    case "existing-item":
      return <TwoItemLayout gridId="drag-grid" />;
    case "legacy-serialized-layout":
      return <LegacySerializedLayoutFixture />;
    case "load-replace":
      return (
        <DocumentGrid
          gridId="loaded-grid"
          initialDocument={singleLabelDocument("loaded-grid", "a", "A")}
        />
      );
    case "migration":
      return (
        <DocumentGrid
          gridId="loaded-grid"
          initialDocument={singleLabelDocument(
            "loaded-grid",
            "active",
            "Active",
            2,
          )}
          settingsCodecs={migrationCodecs}
        />
      );
    case "nested-controllers":
      return <NestedControllersFixture />;
    case "persistence-children":
      return <PersistenceChildrenFixture />;
    case "persistence-document":
      return <PersistenceDocumentFixture />;
    case "remountable-stack":
      return <RemountableStackFixture />;
    case "settings":
      return <SettingsFixture />;
    case "settings-outside-provider":
      return <UpdaterCapture />;
    case "stack-splitter-east":
      return <StackSplitterFixture splitDirection="east" />;
    case "stack-splitter-south":
      return <StackSplitterFixture splitDirection="south" />;
    case "template-drag-state":
      return <TemplateDragStateFixture />;
  }
};

export const GridLayoutDocumentFixture = ({
  variant,
}: {
  variant: GridLayoutDocumentFixtureVariant;
}) => {
  // A new harness for each mount, before any child captures into it.
  useState(() => {
    window.gridTest = createHarness();
  });
  return <div data-testid="fixture-root">{renderVariant(variant)}</div>;
};
