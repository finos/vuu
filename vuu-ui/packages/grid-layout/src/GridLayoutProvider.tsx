import {
  createContext,
  type DragEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
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
import type {
  GridLayoutChangeHandler,
  GridLayoutDescriptor,
} from "./GridModel";
import type { GridSnapshot } from "./GridSnapshot";
import { gridSnapshotToGridLayoutDescriptor } from "./grid-snapshot-adapters";
import { GridLayoutItem, type GridLayoutItemProps } from "./GridLayoutItem";
import { layoutToJSON } from "./layoutToJson";
import { layoutFromJson } from "./layoutFromJson";
import type { LayoutJSON } from "./componentToJson";
import {
  TemplateDragSession,
  TemplateDragSessionContext,
} from "./drag-drop-next/TemplateDragSession";

export type GridChildElementsChangeHandler = (
  id: string,
  childElements: ReactElement<GridLayoutItemProps>[],
) => void;

type GridLayoutOptions = {
  newChildItem: {
    header: boolean;
  };
};

export type ReactElementList = ReactElement[];
export type ReactElementMap<P = unknown> = Record<string, ReactElement<P>>;
export type SerializedComponentMap = Record<string, LayoutJSON>;

export type SerializedGridLayout = {
  components: SerializedComponentMap;
  id: string;
  layout: GridLayoutDescriptor;
};

export type DeserializedGridLayout = {
  components: ReactElementMap<GridLayoutItemProps>;
  id: string;
  layout: GridLayoutDescriptor;
  placeholderIds?: readonly string[];
};

interface GridLayoutProviderContext {
  /**
   * Returns a 'deserialized' copy of a grid layout. Deserialized means the
   * child gridItems have already been reconstituted as React Elements
   */
  getSavedGrid?: (id: string) => DeserializedGridLayout | undefined;
  gridChildItemsMap?: Map<string, SerializedComponentMap>;
  gridLayoutMap?: Map<string, GridLayoutDescriptor>;
  getChildElements?: (
    id: string,
    children?: ReactNode,
  ) => ReactElement[] | undefined;
  options?: GridLayoutOptions;
  onChangeChildElements?: GridChildElementsChangeHandler;
  onChangeLayout?: GridLayoutChangeHandler;
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
  /** @deprecated Use document with settingsCodecs and componentRenderers. */
  serializedLayout?: SerializedGridLayout;
}

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
  const decodedDocument = useMemo(() => {
    if (document === undefined) {
      return undefined;
    }
    if (!settingsCodecs || !componentRenderers) {
      throw new Error(
        "GridLayoutProvider document requires settingsCodecs and componentRenderers",
      );
    }
    const decoded = decodeGridLayoutDocument(document, settingsCodecs);
    if (!decoded.ok) {
      throw new GridLayoutDocumentCodecError(decoded.error);
    }
    const componentById = new Map(
      decoded.value.components.map(
        (component) =>
          [component.id, componentRenderers.render(component)] as const,
      ),
    );
    const layout = gridSnapshotToGridLayoutDescriptor(decoded.value.snapshot);
    return {
      componentById,
      decodedSettings: decoded.value.components.map(
        ({ id, settings, type }) => ({ id, settings, type }),
      ),
      layout,
      placeholderIds: [...decoded.value.document.layout.placeholderIds],
      snapshot: decoded.value.snapshot,
    };
  }, [componentRenderers, document, settingsCodecs]);
  const [gridLayoutMap, gridChildItemsMap] = useMemo<
    [Map<string, GridLayoutDescriptor>, Map<string, SerializedComponentMap>]
  >(() => {
    const componentMap = new Map();
    const layoutMap: Map<string, GridLayoutDescriptor> = new Map();

    if (serializedLayout) {
      const { id, components, layout } = serializedLayout;
      componentMap.set(id, components);
      layoutMap.set(id, layout);
    }
    return [layoutMap, componentMap];
  }, [serializedLayout]);

  const onChangeLayout = useCallback<GridLayoutChangeHandler>(
    (id, gridLayoutDescriptor) => {
      console.log(`[GridLayoutProvider] ${id} onChangeLayout
      ${JSON.stringify(gridLayoutDescriptor, null, 2)}`);
      gridLayoutMap.set(id, gridLayoutDescriptor);
    },
    [gridLayoutMap],
  );

  /**
   * We track child elements for two reasons:
   *  - layout persistence to remote storage
   *  - re-mounting of grid layout that has been previously
   * unmounted, e.g because of tab switching withn a tabbed display
   */
  const onChangeChildElements = useCallback<GridChildElementsChangeHandler>(
    (layoutId, childElements) => {
      // console.log(`[GridLayoutProvider] #${layoutId} onChangeChildElements`, {
      //   childElements,
      // });
      const serializedComponentMap =
        childElements.reduce<SerializedComponentMap>((map, component) => {
          const { id: gridLayoutItemId } = component.props;
          if (typeof gridLayoutItemId !== "string") {
            throw Error(
              "[GridLayoutProvider] onChangeChildElements, child GridLayoutItem has no id",
            );
          }
          map[gridLayoutItemId] = layoutToJSON(component);
          return map;
        }, {});
      gridChildItemsMap.set(layoutId, serializedComponentMap);
    },
    [gridChildItemsMap],
  );
  const getChildElements = useCallback((
    /*id: string, children?: ReactNode*/
  ) => {
    // console.log(`[GridLayoutProvider] #${id} getChildElements `, {
    //   children,
    // });
    return undefined;
  }, []);

  const getSavedGrid = useCallback(
    (id: string): DeserializedGridLayout | undefined => {
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
      const layoutJSON = gridChildItemsMap.get(id);
      const layout = gridLayoutMap.get(id);
      if (layoutJSON && layout) {
        return {
          components: Object.entries(layoutJSON).reduce<
            Record<string, ReactElement<GridLayoutItemProps>>
          >((map, [id, layoutJSON]) => {
            const gridItem = layout.gridLayoutItems?.[id];
            if (!gridItem) {
              throw Error(
                `[GridLayoutProvider] no saved gridLayoutItem details for #${id}`,
              );
            }
            const { gridArea, ...props } = gridItem;
            map[id] = (
              <GridLayoutItem {...props} id={id} key={id} style={{ gridArea }}>
                {layoutFromJson(layoutJSON)}
              </GridLayoutItem>
            );
            return map;
          }, {}),
          id,
          layout,
        };
      }
    },
    [decodedDocument, gridChildItemsMap, gridLayoutMap],
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
          getChildElements,
          getSavedGrid,
          gridChildItemsMap,
          gridLayoutMap,
          onChangeChildElements,
          onChangeLayout,
          onCommittedSnapshot,
          options,
        }}
      >
        {children}
      </GridLayoutProviderContext.Provider>
    </TemplateDragSessionContext.Provider>
  );
};

export const useGridChangeHandler = () => {
  const { onChangeChildElements, onChangeLayout, onCommittedSnapshot } =
    useContext(GridLayoutProviderContext);
  return { onChangeChildElements, onChangeLayout, onCommittedSnapshot };
};

export const useSavedGrid = () => {
  const { getSavedGrid } = useContext(GridLayoutProviderContext);
  return getSavedGrid;
};

export const useGridLayoutOptions = () => {
  const { options } = useContext(GridLayoutProviderContext);
  return options;
};
