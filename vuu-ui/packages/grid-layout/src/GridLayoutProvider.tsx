import {
  createContext,
  type DragEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  GridComponentRendererRegistry,
  GridComponentSettingsInput,
  GridComponentSettingsRegistry,
} from "./GridComponentSettings";
import {
  decodeGridLayoutDocument,
  encodeGridLayoutDocument,
  immutableGridLayoutDocument,
  type GridLayoutDocument,
  GridLayoutDocumentCodecError,
  type GridLayoutDocumentError,
} from "./GridLayoutDocument";
import {
  createLegacyGridLayoutReader,
  type LegacyDeserializedGridLayout,
  type LegacySerializedComponentMap,
  type SerializedGridLayout,
} from "./GridLayoutLegacyCompatibility";
import type { GridSnapshot } from "./GridSnapshot";
import { gridSnapshotToGridLayoutDescriptor } from "./grid-snapshot-adapters";
import { GridLayoutItem } from "./GridLayoutItem";
import {
  TemplateDragSession,
  TemplateDragSessionContext,
  useTemplateDragSession,
} from "./drag-drop-next/TemplateDragSession";
import type { ComponentTemplate } from "./GridLayoutContext";
import { isTypedComponentTemplate } from "./GridLayoutContext";
import type { GridCommittedTransition } from "./GridController";

type GridLayoutOptions = {
  newChildItem: {
    header: boolean;
  };
};

/** @deprecated Use GridLayoutDocument component records. */
export type SerializedComponentMap = LegacySerializedComponentMap;
/** @deprecated Use a decoded GridLayoutDocument. */
export type DeserializedGridLayout = LegacyDeserializedGridLayout;
export type { SerializedGridLayout } from "./GridLayoutLegacyCompatibility";

interface GridLayoutProviderContext {
  /**
   * Returns a 'deserialized' copy of a grid layout. Deserialized means the
   * child gridItems have already been reconstituted as React Elements
   */
  getSavedGrid?: (id: string) => LegacyDeserializedGridLayout | undefined;
  options?: GridLayoutOptions;
  onCommittedSnapshot?: (
    transition: GridCommittedTransition,
    placeholderIds: readonly string[],
  ) => void;
  releaseTemplateComponent?: (id: string) => void;
  renderTemplateComponent?: (
    template: ComponentTemplate,
    id: string,
  ) => ReactElement | undefined;
}

const GridLayoutProviderContext = createContext<GridLayoutProviderContext>({});

export type GridLayoutDragEndHandler = (
  evt: DragEvent<HTMLElement>,
  dropped: boolean,
) => void;

export interface GridLayoutProviderProps {
  children: ReactNode;
  componentRenderers?: GridComponentRendererRegistry;
  componentSettings?: readonly GridComponentSettingsInput[];
  document?: unknown;
  documentController?: GridLayoutDocumentController;
  onDocumentChange?: GridLayoutDocumentChangeHandler;
  onDocumentError?: (error: GridLayoutDocumentError) => void;
  options?: GridLayoutOptions;
  settingsCodecs?: GridComponentSettingsRegistry;
  /**
   * Read-only compatibility input. Changes are never written to this shape.
   *
   * @deprecated Use document with settingsCodecs and componentRenderers.
   */
  serializedLayout?: SerializedGridLayout;
}

export interface GridLayoutDocumentChange {
  readonly document: GridLayoutDocument;
  readonly kind: GridCommittedTransition["kind"];
  readonly removedComponentInstanceIds: readonly string[];
  readonly revision: number;
}

export type GridLayoutDocumentChangeHandler = (
  document: GridLayoutDocument,
  change: GridLayoutDocumentChange,
) => void;

export type GridLayoutDocumentStoreListener = () => void;

export class GridLayoutDocumentController {
  #change: GridLayoutDocumentChange | undefined;
  #document: GridLayoutDocument | undefined;
  readonly #listeners = new Set<GridLayoutDocumentStoreListener>();

  constructor(document?: GridLayoutDocument) {
    this.#document = document
      ? immutableGridLayoutDocument(document)
      : undefined;
  }

  getSnapshot = () => this.#document;

  getChange = () => this.#change;

  subscribe = (listener: GridLayoutDocumentStoreListener) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  replace(document: GridLayoutDocument | undefined): void {
    const immutableDocument = document
      ? immutableGridLayoutDocument(document)
      : undefined;
    if (this.#document === document) {
      return;
    }
    this.#document = immutableDocument;
    this.#change = undefined;
    this.#notify();
  }

  publish(change: GridLayoutDocumentChange): void {
    this.#document = change.document;
    this.#change = change;
    this.#notify();
  }

  #notify() {
    for (const listener of [...this.#listeners]) {
      if (this.#listeners.has(listener)) {
        listener();
      }
    }
  }
}

interface ResolvedGridLayoutDocument {
  readonly componentById: ReadonlyMap<string, ReactElement>;
  readonly decodedSettings: readonly GridComponentSettingsInput[];
  readonly document: GridLayoutDocument;
  readonly layout: ReturnType<typeof gridSnapshotToGridLayoutDescriptor>;
  readonly placeholderIds: readonly string[];
  readonly snapshot: GridSnapshot;
}

type DocumentResolution =
  | {
      readonly ok: true;
      readonly value: ResolvedGridLayoutDocument | undefined;
    }
  | { readonly error: GridLayoutDocumentError; readonly ok: false };

const resolveDocument = (
  document: unknown,
  settingsCodecs: GridComponentSettingsRegistry | undefined,
  componentRenderers: GridComponentRendererRegistry | undefined,
): DocumentResolution => {
  if (document === undefined) {
    return { ok: true, value: undefined };
  }
  if (!settingsCodecs || !componentRenderers) {
    return {
      error: {
        code: "INVALID_DOCUMENT",
        message:
          "GridLayoutProvider document requires settingsCodecs and componentRenderers",
        path: "$",
      },
      ok: false,
    };
  }
  const decoded = decodeGridLayoutDocument(document, settingsCodecs);
  if (!decoded.ok) {
    return decoded;
  }
  const componentById = new Map<string, ReactElement>();
  for (let index = 0; index < decoded.value.components.length; index += 1) {
    const component = decoded.value.components[index];
    try {
      componentById.set(component.id, componentRenderers.render(component));
    } catch (cause) {
      return {
        error: {
          code: "COMPONENT_RENDERER_ERROR",
          message:
            cause instanceof Error
              ? cause.message
              : `Unable to render component "${component.id}"`,
          path: `$.components[${index}]`,
        },
        ok: false,
      };
    }
  }
  return {
    ok: true,
    value: {
      componentById,
      decodedSettings: decoded.value.components.map(
        ({ id, settings, type }) => ({ id, settings, type }),
      ),
      layout: gridSnapshotToGridLayoutDescriptor(decoded.value.snapshot),
      document: decoded.value.document,
      placeholderIds: [...decoded.value.document.layout.placeholderIds],
      snapshot: decoded.value.snapshot,
    },
  };
};

export const GridLayoutProvider = (
  props: GridLayoutProviderProps,
): ReactElement => {
  const {
    children,
    componentRenderers,
    componentSettings,
    document,
    documentController,
    onDocumentChange,
    onDocumentError,
    serializedLayout,
    settingsCodecs,
    options,
  } = props;
  const inheritedTemplateDragSession = useTemplateDragSession();
  const localTemplateDragSession = useMemo(() => new TemplateDragSession(), []);
  const templateDragSession =
    inheritedTemplateDragSession ?? localTemplateDragSession;
  const runtimeComponentSettings = useRef(
    new Map<string, GridComponentSettingsInput>(),
  );
  const templateComponentIds = useRef(new Set<string>());
  const documentResolution = useMemo(
    () => resolveDocument(document, settingsCodecs, componentRenderers),
    [componentRenderers, document, settingsCodecs],
  );
  const [decodedDocument, setDecodedDocument] = useState<
    ResolvedGridLayoutDocument | undefined
  >(() => (documentResolution.ok ? documentResolution.value : undefined));
  const reportedError = useRef<DocumentResolution | undefined>(undefined);
  useEffect(() => {
    if (documentResolution.ok) {
      reportedError.current = undefined;
      setDecodedDocument(documentResolution.value);
      const nextSettings = new Map(
        (
          componentSettings ??
          documentResolution.value?.decodedSettings ??
          []
        ).map((component) => [component.id, component]),
      );
      for (const componentId of templateComponentIds.current) {
        const runtimeSettings =
          runtimeComponentSettings.current.get(componentId);
        if (runtimeSettings) {
          nextSettings.set(componentId, runtimeSettings);
        }
      }
      runtimeComponentSettings.current = nextSettings;
      if (
        documentController &&
        documentResolution.value &&
        documentController.getSnapshot() === undefined
      ) {
        documentController.replace(documentResolution.value.document);
      }
    } else if (
      reportedError.current !== documentResolution &&
      onDocumentError
    ) {
      reportedError.current = documentResolution;
      onDocumentError(documentResolution.error);
    } else if (!onDocumentError) {
      throw new GridLayoutDocumentCodecError(documentResolution.error);
    }
  }, [
    componentSettings,
    documentController,
    documentResolution,
    onDocumentError,
  ]);
  const legacyReader = useMemo(() => {
    return serializedLayout
      ? createLegacyGridLayoutReader(serializedLayout)
      : undefined;
  }, [serializedLayout]);

  const getSavedGrid = useCallback(
    (id: string): LegacyDeserializedGridLayout | undefined => {
      if (decodedDocument?.snapshot.gridId === id) {
        return {
          components: Object.fromEntries(
            decodedDocument.snapshot.items.flatMap((item) => {
              const {
                column,
                componentInstanceId,
                dropTarget,
                id: itemId,
                row,
                ...metadata
              } = item;
              const component = decodedDocument.componentById.get(
                componentInstanceId ?? itemId,
              );
              return component
                ? [
                    [
                      itemId,
                      <GridLayoutItem
                        {...metadata}
                        data-drop-target={dropTarget}
                        id={itemId}
                        key={itemId}
                        style={{
                          gridArea: `${row.start}/${column.start}/${row.start + row.span}/${column.start + column.span}`,
                        }}
                      >
                        {component}
                      </GridLayoutItem>,
                    ] as const,
                  ]
                : [];
            }),
          ),
          id,
          layout: decodedDocument.layout,
          placeholderIds: decodedDocument.placeholderIds,
        };
      }
      return legacyReader?.getSavedGrid(id);
    },
    [decodedDocument, legacyReader],
  );

  const renderTemplateComponent = useCallback(
    (template: ComponentTemplate, id: string): ReactElement | undefined => {
      if (!isTypedComponentTemplate(template)) {
        return undefined;
      }
      if (!settingsCodecs || !componentRenderers) {
        throw new Error(
          "Typed component templates require settingsCodecs and componentRenderers",
        );
      }
      const decoded = settingsCodecs.decode({ id, ...template.component });
      if (!decoded.ok) {
        throw new GridLayoutDocumentCodecError({
          code: "COMPONENT_SETTINGS_ERROR",
          componentError: decoded.error,
          message: decoded.error.message,
          path: "$.component",
          version: decoded.error.version,
        });
      }
      runtimeComponentSettings.current.set(id, {
        id,
        settings: decoded.value.settings,
        type: decoded.value.type,
      });
      templateComponentIds.current.add(id);
      return componentRenderers.render(decoded.value);
    },
    [componentRenderers, settingsCodecs],
  );
  const releaseTemplateComponent = useCallback((id: string) => {
    runtimeComponentSettings.current.delete(id);
    templateComponentIds.current.delete(id);
  }, []);

  const onCommittedSnapshot = useCallback(
    (
      transition: GridCommittedTransition,
      placeholderIds: readonly string[],
    ) => {
      if (!onDocumentChange && !documentController) {
        return;
      }
      if (!settingsCodecs) {
        const error: GridLayoutDocumentError = {
          code: "INVALID_DOCUMENT",
          message: "onDocumentChange requires a GridComponentSettingsRegistry",
          path: "$.components",
        };
        if (onDocumentError) {
          onDocumentError(error);
          return;
        }
        throw new GridLayoutDocumentCodecError(error);
      }
      const { previous, snapshot } = transition;
      const availableSettings = [...runtimeComponentSettings.current.values()];
      const referencedComponentIds = new Set(
        snapshot.items.map(
          ({ componentInstanceId, id }) => componentInstanceId ?? id,
        ),
      );
      const settings = availableSettings.filter(({ id }) =>
        referencedComponentIds.has(id),
      );
      const encoded = encodeGridLayoutDocument(snapshot, settingsCodecs, {
        componentSettings: settings,
        placeholderIds,
      });
      if (encoded.ok) {
        const currentComponentIds = new Set(
          snapshot.items.map(
            ({ componentInstanceId, id }) => componentInstanceId ?? id,
          ),
        );
        const removedComponentInstanceIds = previous.items
          .map(({ componentInstanceId, id }) => componentInstanceId ?? id)
          .filter(
            (componentId) =>
              !currentComponentIds.has(componentId) &&
              runtimeComponentSettings.current.has(componentId),
          );
        const change: GridLayoutDocumentChange = {
          document: encoded.value,
          kind: transition.kind,
          removedComponentInstanceIds,
          revision: snapshot.revision,
        };
        documentController?.publish(change);
        onDocumentChange?.(encoded.value, change);
        for (const componentId of removedComponentInstanceIds) {
          runtimeComponentSettings.current.delete(componentId);
          templateComponentIds.current.delete(componentId);
        }
      } else if (onDocumentError) {
        onDocumentError(encoded.error);
      } else {
        throw new GridLayoutDocumentCodecError(encoded.error);
      }
    },
    [documentController, onDocumentChange, onDocumentError, settingsCodecs],
  );

  return (
    <TemplateDragSessionContext.Provider value={templateDragSession}>
      <GridLayoutProviderContext.Provider
        value={{
          getSavedGrid,
          onCommittedSnapshot,
          options,
          releaseTemplateComponent,
          renderTemplateComponent,
        }}
      >
        {document !== undefined && decodedDocument === undefined
          ? null
          : children}
      </GridLayoutProviderContext.Provider>
    </TemplateDragSessionContext.Provider>
  );
};

export const useGridChangeHandler = () => {
  const {
    onCommittedSnapshot,
    releaseTemplateComponent,
    renderTemplateComponent,
  } = useContext(GridLayoutProviderContext);
  return {
    onCommittedSnapshot,
    releaseTemplateComponent,
    renderTemplateComponent,
  };
};

export const useSavedGrid = () => {
  const { getSavedGrid } = useContext(GridLayoutProviderContext);
  return getSavedGrid;
};

export const useGridLayoutOptions = () => {
  const { options } = useContext(GridLayoutProviderContext);
  return options;
};
