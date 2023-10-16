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
  SelectionStrategy,
  SelectionType,
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
  S extends SelectionStrategy = "default"
> extends DropdownBaseProps,
    Pick<
      ListProps<Item, S>,
      | "ListItem"
      | "defaultSelected"
      | "itemToString"
      | "onSelect"
      | "onSelectionChange"
      | "selected"
      | "selectionStrategy"
      | "source"
      | "width"
    > {
  // TODO There is overlap here between ListProps and top level List props
  ListProps?: Omit<ListProps<Item, S>, "ListItem" | "itemToString" | "source">;
}

export const Dropdown = forwardRef(function Dropdown<
  Item = string,
  S extends SelectionStrategy = "default"
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
  }: DropdownProps<Item, S>,
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
  } = useDropdown<Item, S>({
    collectionHook,
    defaultHighlightedIndex: ListProps?.defaultHighlightedIndex,
    defaultIsOpen,
    defaultSelected: collectionHook.itemToCollectionItemId(defaultSelected),
    highlightedIndex: ListProps?.highlightedIndex,
    isOpen: isOpenProp,
    itemToString,
    listRef,
    onHighlight: ListProps?.onHighlight,
    onOpenChange,
    onSelectionChange,
    onSelect,
    selected: collectionHook.itemToCollectionItemId(selectedProp as any),
    selectionStrategy,
  });

  const itemIdToItem = useCallback(
    (itemId: string | string[]) => {
      if (Array.isArray(itemId)) {
        const items = itemId.map((id) => collectionHook.itemById(id));
        return items as SelectionType<Item, S>;
      } else {
        return collectionHook.itemById(itemId) as SelectionType<Item, S>;
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
        <List<Item, S>
          ListItem={ListItem}
          itemToString={itemToString}
          {...ListProps}
          highlightedIndex={highlightedIndex}
          listHandlers={listHandlers}
          onSelectionChange={onSelectionChange}
          onSelect={onSelect}
          ref={listRef}
          selected={selected === undefined ? undefined : itemIdToItem(selected)}
          selectionStrategy={selectionStrategy}
        />
      </DropdownBase>
    </CollectionProvider>
  );
}) as <Item, S extends SelectionStrategy = "default">(
  props: DropdownProps<Item, S> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<DropdownProps<Item>>;
