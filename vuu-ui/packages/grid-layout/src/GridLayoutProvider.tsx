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
} from "./drag-drop-next/TemplateDragSession";

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
    snapshot: GridSnapshot,
    placeholderIds: readonly string[],
  ) => void;
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
  onDocumentChange?: (document: GridLayoutDocument) => void;
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

interface ResolvedGridLayoutDocument {
  readonly componentById: ReadonlyMap<string, ReactElement>;
  readonly decodedSettings: readonly GridComponentSettingsInput[];
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
    onDocumentChange,
    onDocumentError,
    serializedLayout,
    settingsCodecs,
    options,
  } = props;
  const templateDragSession = useMemo(() => new TemplateDragSession(), []);
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
    } else if (
      reportedError.current !== documentResolution &&
      onDocumentError
    ) {
      reportedError.current = documentResolution;
      onDocumentError(documentResolution.error);
    } else if (!onDocumentError) {
      throw new GridLayoutDocumentCodecError(documentResolution.error);
    }
  }, [documentResolution, onDocumentError]);
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

  const onCommittedSnapshot = useCallback(
    (snapshot: GridSnapshot, placeholderIds: readonly string[]) => {
      if (!onDocumentChange) {
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
      const availableSettings =
        componentSettings ?? decodedDocument?.decodedSettings ?? [];
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
        onDocumentChange(encoded.value);
      } else if (onDocumentError) {
        onDocumentError(encoded.error);
      } else {
        throw new GridLayoutDocumentCodecError(encoded.error);
      }
    },
    [
      componentSettings,
      decodedDocument,
      onDocumentChange,
      onDocumentError,
      settingsCodecs,
    ],
  );

  return (
    <TemplateDragSessionContext.Provider value={templateDragSession}>
      <GridLayoutProviderContext.Provider
        value={{
          getSavedGrid,
          onCommittedSnapshot,
          options,
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
  const { onCommittedSnapshot } = useContext(GridLayoutProviderContext);
  return { onCommittedSnapshot };
};

export const useSavedGrid = () => {
  const { getSavedGrid } = useContext(GridLayoutProviderContext);
  return getSavedGrid;
};

export const useGridLayoutOptions = () => {
  const { options } = useContext(GridLayoutProviderContext);
  return options;
};
