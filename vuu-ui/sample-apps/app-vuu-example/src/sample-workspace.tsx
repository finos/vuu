import type {
  GridComponentSettingsCodec,
  GridLayoutDocument,
  JsonValue,
} from "@heswell/grid-layout";
import {
  createWorkspaceComponentRegistries,
  shellWorkspaceComponentRegistrations,
  useComponentPersistentState,
  type ComponentPersistentStateV1,
  type WorkspaceComponentRegistration,
  type WorkspaceSnapshotV1,
} from "@vuu-ui/vuu-shell";
import { importCSS, type DynamicFeatureProps } from "@vuu-ui/vuu-utils";
import React, { Suspense, useEffect } from "react";

interface SortFixtureSettings {
  readonly columns: readonly string[];
  readonly title: string;
}

interface SortFixtureState {
  readonly sort: readonly {
    readonly column: string;
    readonly direction: "asc" | "desc";
  }[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSortFixtureSettings = (value: unknown): value is SortFixtureSettings =>
  isRecord(value) &&
  typeof value.title === "string" &&
  Array.isArray(value.columns) &&
  value.columns.every((column) => typeof column === "string");

const sortFixtureCodec: GridComponentSettingsCodec<SortFixtureSettings> = {
  decode: (value) =>
    isSortFixtureSettings(value)
      ? { ok: true, value }
      : {
          error: {
            code: "INVALID_SORT_FIXTURE",
            message: "sort fixture requires a title and string columns",
            path: "$",
          },
          ok: false,
        },
  encode: (value) => ({ ok: true, value }),
  isSettings: isSortFixtureSettings,
  version: 1,
};

const decodeSortState = (
  state: ComponentPersistentStateV1 | undefined,
): SortFixtureState => {
  if (
    state?.componentType === "sample-sort-fixture" &&
    state.schemaVersion === 1 &&
    isRecord(state.value) &&
    Array.isArray(state.value.sort) &&
    state.value.sort.every(
      (item) =>
        isRecord(item) &&
        typeof item.column === "string" &&
        (item.direction === "asc" || item.direction === "desc"),
    )
  ) {
    return state.value as unknown as SortFixtureState;
  }
  return { sort: [] };
};

export const SortStateFixture = ({
  componentId,
  settings,
}: {
  readonly componentId: string;
  readonly settings: SortFixtureSettings;
}) => {
  const [persistedState, setPersistentState] =
    useComponentPersistentState(componentId);
  const state = decodeSortState(persistedState);
  const setSort = (column: string) => {
    const current = state.sort.find((criterion) => criterion.column === column);
    const next: SortFixtureState = {
      sort: [
        {
          column,
          direction: current?.direction === "asc" ? "desc" : "asc",
        },
      ],
    };
    setPersistentState({
      componentType: "sample-sort-fixture",
      schemaVersion: 1,
      value: next as unknown as JsonValue,
    });
  };

  return (
    <section data-component-id={componentId}>
      <h2>{settings.title}</h2>
      <p data-testid="sort-state">
        {state.sort.length
          ? `${state.sort[0].column} ${state.sort[0].direction}`
          : "Unsorted"}
      </p>
      {settings.columns.map((column) => (
        <button key={column} onClick={() => setSort(column)} type="button">
          Sort by {column}
        </button>
      ))}
    </section>
  );
};

const isDynamicFeatureSettings = (
  value: unknown,
): value is DynamicFeatureProps =>
  isRecord(value) &&
  typeof value.mfComponent === "string" &&
  typeof value.mfScope === "string" &&
  typeof value.mfUrl === "string";

const dynamicFeatureCodec: GridComponentSettingsCodec<DynamicFeatureProps> = {
  decode: (value) =>
    isDynamicFeatureSettings(value)
      ? { ok: true, value }
      : {
          error: {
            code: "INVALID_DYNAMIC_FEATURE",
            message: "dynamic feature module settings are incomplete",
            path: "$",
          },
          ok: false,
        },
  encode: (value) => ({ ok: true, value }),
  isSettings: isDynamicFeatureSettings,
  version: 1,
};

const featureComponents = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>
>();

const DirectFeature = ({
  ComponentProps,
  css,
  mfUrl,
  ...props
}: DynamicFeatureProps) => {
  useEffect(() => {
    if (css) {
      void importCSS(css).then((styleSheet) => {
        if (!document.adoptedStyleSheets.includes(styleSheet)) {
          document.adoptedStyleSheets = [
            ...document.adoptedStyleSheets,
            styleSheet,
          ];
        }
      });
    }
  }, [css]);
  let Component = featureComponents.get(mfUrl);
  if (!Component) {
    Component = React.lazy(() => import(/* webpackIgnore: true */ mfUrl));
    featureComponents.set(mfUrl, Component);
  }
  return (
    <Suspense fallback={<div role="status">Loading {props.title}…</div>}>
      <Component {...props} {...ComponentProps} />
    </Suspense>
  );
};

const appRegistrations: readonly WorkspaceComponentRegistration<unknown>[] = [
  ...shellWorkspaceComponentRegistrations.filter(
    ({ type }) => type !== "vuu-dynamic-feature",
  ),
  {
    codec: dynamicFeatureCodec as GridComponentSettingsCodec<unknown>,
    render: (settings) => (
      <DirectFeature {...(settings as DynamicFeatureProps)} />
    ),
    type: "vuu-dynamic-feature",
  },
  {
    codec: sortFixtureCodec as GridComponentSettingsCodec<unknown>,
    render: (settings, componentId) => (
      <SortStateFixture
        componentId={componentId}
        settings={settings as SortFixtureSettings}
      />
    ),
    type: "sample-sort-fixture",
  },
];

export const sampleWorkspaceRegistries =
  createWorkspaceComponentRegistries(appRegistrations);

export const sampleWorkspaceDocument: GridLayoutDocument = {
  components: [
    {
      id: "sample-sort-table",
      settings: {
        columns: ["symbol", "price", "quantity"],
        title: "Persistent table sort fixture",
      },
      type: "sample-sort-fixture",
      version: 1,
    },
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr"],
    id: "sample-workspace-grid",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "sample-sort-table",
        header: true,
        id: "sample-sort-table-item",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Persistent sort",
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
};

export const sampleWorkspace: WorkspaceSnapshotV1 = {
  componentState: {
    "sample-sort-table": {
      componentType: "sample-sort-fixture",
      schemaVersion: 1,
      value: {
        sort: [{ column: "symbol", direction: "asc" }],
      },
    },
  },
  layout: sampleWorkspaceDocument,
  version: 1,
};
