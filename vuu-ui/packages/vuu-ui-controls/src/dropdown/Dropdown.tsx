import { useForkRef } from "@salt-ds/core";
import {
  cloneElement,
  ForwardedRef,
  forwardRef,
  ReactElement,
  useCallback,
  useRef,
} from "react";

import { useId } from "@finos/vuu-layout";
import {
  CollectionProvider,
  itemToString as defaultItemToString,
  SelectionProps,
  SelectionStrategy,
  SingleSelectionStrategy,
  useCollectionItems,
} from "../common-hooks";
import { List, ListProps } from "../list";
import { DropdownBase, MaybeChildProps } from "./DropdownBase";
import { DropdownButton } from "./DropdownButton";
import { DropdownBaseProps } from "./dropdownTypes";
import { forwardCallbackProps } from "../utils";
import { useDropdown } from "./useDropdown";

export interface DropdownProps<
  Item = string,
  Selection extends SelectionStrategy = "default"
> extends DropdownBaseProps,
    Pick<
      ListProps<Item, Selection>,
      "ListItem" | "itemToString" | "source" | "width"
    >,
    SelectionProps<Item, Selection> {
  ListProps?: Omit<
    ListProps<Item, Selection>,
    "ListItem" | "itemToString" | "source"
  >;
}

export const Dropdown = forwardRef(function Dropdown<
  Item = string,
  Selection extends SelectionStrategy = "default"
>(
  {
    "aria-label": ariaLabel,
    children,
    defaultIsOpen,
    defaultSelected,
    id: idProp,
    isOpen: isOpenProp,
    itemToString = defaultItemToString,
    onOpenChange,
    onSelectionChange,
    onSelect,
    selected: selectedProp,
    selectionStrategy,
    source,
    triggerComponent,
    ListItem,
    ListProps,
    width = 180,
    ...props
  }: DropdownProps<Item, Selection>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const id = useId(idProp);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const forkedRef = useForkRef<HTMLDivElement>(rootRef, forwardedRef);

  const collectionHook = useCollectionItems<Item>({
    id,
    source,
    children,
    options: {
      itemToString,
    },
  });

  const {
    highlightedIndex,
    triggerLabel,
    listHandlers,
    listControlProps,
    selected,
    ...dropdownListHook
  } = useDropdown<Item, Selection>({
    collectionHook,
    defaultHighlightedIndex: ListProps?.defaultHighlightedIndex,
    defaultIsOpen,
    defaultSelected: collectionHook.itemToCollectionItemId<
      Selection,
      typeof defaultSelected
    >(defaultSelected),
    highlightedIndex: ListProps?.highlightedIndex,
    isOpen: isOpenProp,
    itemToString,
    label: "Dropdown",
    listRef,
    onHighlight: ListProps?.onHighlight,
    onOpenChange,
    onSelectionChange,
    onSelect,
    selected: collectionHook.itemToCollectionItemId<
      Selection,
      typeof selectedProp
    >(selectedProp),
    selectionStrategy,
  });

  const collectionItemsToItem = useCallback(
    (
      itemIdOrItemIds?: string | null | string[]
    ):
      | undefined
      | (Selection extends SingleSelectionStrategy ? Item | null : Item[]) => {
      type returnType = Selection extends SingleSelectionStrategy
        ? Item | null
        : Item[];
      if (Array.isArray(itemIdOrItemIds)) {
        return itemIdOrItemIds.map((id) =>
          collectionHook.itemById(id)
        ) as returnType;
      } else if (itemIdOrItemIds) {
        return collectionHook.itemById(itemIdOrItemIds) as returnType;
      }
    },
    [collectionHook]
  );

  const getTriggerComponent = () => {
    const ariaProps = {
      "aria-activedescendant": dropdownListHook.isOpen
        ? listControlProps?.["aria-activedescendant"]
        : undefined,
      "aria-label": ariaLabel,
    };
    if (triggerComponent) {
      const ownProps = triggerComponent.props as MaybeChildProps;
      return cloneElement(
        triggerComponent,
        forwardCallbackProps(ownProps, {
          ...(dropdownListHook.isOpen ? listControlProps : {}),
          ...ariaProps,
        })
      );
    } else {
      return (
        <DropdownButton
          label={triggerLabel}
          {...(dropdownListHook.isOpen ? listControlProps : {})}
          {...ariaProps}
        />
      );
    }
  };
  return (
    <CollectionProvider<Item> collectionHook={collectionHook}>
      <DropdownBase
        {...props}
        id={id}
        isOpen={dropdownListHook.isOpen}
        onOpenChange={dropdownListHook.onOpenChange}
        placement={
          ListProps?.width === undefined ? "below-full-width" : "below"
        }
        ref={forkedRef}
        width={width}
      >
        {getTriggerComponent()}
        <List<Item, Selection>
          ListItem={ListItem}
          itemToString={itemToString}
          {...ListProps}
          highlightedIndex={highlightedIndex}
          listHandlers={listHandlers}
          onSelectionChange={onSelectionChange}
          onSelect={onSelect}
          ref={listRef}
          selected={collectionItemsToItem(selected)}
          selectionStrategy={selectionStrategy}
        />
      </DropdownBase>
    </CollectionProvider>
  );
}) as <Item, Selection extends SelectionStrategy = "default">(
  props: DropdownProps<Item, Selection> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<DropdownProps<Item, Selection>>;
