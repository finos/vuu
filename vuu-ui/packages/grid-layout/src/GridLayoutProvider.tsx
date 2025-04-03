import {
  createContext,
  DragEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  GridLayoutChangeHandler,
  GridLayoutChildItemDescriptor,
  GridLayoutDescriptor,
} from "./GridModel";
import { GridLayoutItemProps } from "./GridLayoutItem";
import { layoutToJSON } from "./layoutToJson";
import { layoutFromJson } from "./layoutFromJson";
import { LayoutJSON } from "@finos/vuu-utils";

export type GridChildElementsChangeHandler = (
  id: string,
  childElements: ReactElement<GridLayoutItemProps>[],
) => void;

type GridLayoutOptions = {
  newChildItem: {
    header: boolean;
  };
};

export type ComponentMap = Record<string, ReactElement>;
export type SerializedComponentMap = Record<string, LayoutJSON>;

export type SerializedGridLayout<T = SerializedComponentMap | ComponentMap> = {
  components: T;
  id: string;
  layout: GridLayoutDescriptor<Record<string, GridLayoutChildItemDescriptor>>;
};

interface GridLayoutProviderContext {
  getSavedGrid?: (id: string) => SerializedGridLayout | undefined;
  gridChildItemsMap?: Map<string, SerializedComponentMap>;
  gridLayoutMap?: Map<string, GridLayoutDescriptor>;
  getChildElements?: (
    id: string,
    children?: ReactNode,
  ) => ReactElement[] | undefined;
  options?: GridLayoutOptions;
  onChangeChildElements?: GridChildElementsChangeHandler;
  onChangeLayout?: GridLayoutChangeHandler;
}

const GridLayoutProviderContext = createContext<GridLayoutProviderContext>({});

export type GridLayoutDragEndHandler = (evt: DragEvent<HTMLElement>) => void;

export interface GridLayoutProviderProps {
  children: ReactNode;
  options?: GridLayoutOptions;
  serializedLayout?: SerializedGridLayout;
}

export const GridLayoutProvider = (
  props: GridLayoutProviderProps,
): ReactElement => {
  const { children, serializedLayout, options } = props;
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
      console.log(`[GridLayoutProvider] #${layoutId} onChangeChildElements`, {
        childElements,
      });
      const serializedComponentMap =
        childElements.reduce<SerializedComponentMap>((map, component) => {
          const { id: gridLayoutItemId } = component.props;
          if (typeof gridLayoutItemId !== "string") {
            throw Error(
              `[GridLayoutProvider] onChangeChildElements, child GridLayoutItem has no id`,
            );
          }
          map[gridLayoutItemId] = layoutToJSON(component);
          return map;
        }, {});
      gridChildItemsMap.set(layoutId, serializedComponentMap);
    },
    [gridChildItemsMap],
  );
  const getChildElements = useCallback((id: string, children?: ReactNode) => {
    console.log(`[GridLayoutProvider] #${id} getChildElements `, {
      children,
    });
    return undefined;
  }, []);

  const getSavedGrid = useCallback(
    (id: string): SerializedGridLayout<ComponentMap> | undefined => {
      const layoutJSON = gridChildItemsMap.get(id);
      const layout = gridLayoutMap.get(id);
      if (layoutJSON && layout) {
        return {
          components: Object.entries(layoutJSON).reduce<
            Record<string, ReactElement>
          >((map, [id, layoutJSON]) => {
            map[id] = layoutFromJson(layoutJSON, "");
            return map;
          }, {}),
          id,
          layout,
        };
      }
    },
    [gridChildItemsMap, gridLayoutMap],
  );

  return (
    <GridLayoutProviderContext.Provider
      value={{
        getChildElements,
        getSavedGrid,
        gridChildItemsMap,
        gridLayoutMap,
        onChangeChildElements,
        onChangeLayout,
        options,
      }}
    >
      {children}
    </GridLayoutProviderContext.Provider>
  );
};

export const useGridChangeHandler = () => {
  const { onChangeChildElements, onChangeLayout } = useContext(
    GridLayoutProviderContext,
  );
  return { onChangeChildElements, onChangeLayout };
};

export const useSavedGrid = () => {
  const { getSavedGrid } = useContext(GridLayoutProviderContext);
  return getSavedGrid;
};

export const useGridLayoutOptions = () => {
  const { options } = useContext(GridLayoutProviderContext);
  return options;
};
