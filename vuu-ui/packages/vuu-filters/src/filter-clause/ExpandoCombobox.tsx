import { itemToString as defaultToString } from "@finos/vuu-utils";
import {
  ComboBox,
  ComboBoxProps,
  MultiSelectionHandler,
  SelectionStrategy,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";
import cx from "classnames";
import {
  FormEvent,
  ForwardedRef,
  forwardRef,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import "./ExpandoCombobox.css";

const classBase = "vuuExpandoCombobox";

const NO_INPUT_PROPS = {};

export interface ExpandoComboboxProps<
  Item = string,
  S extends SelectionStrategy = "default"
> extends ComboBoxProps<Item, S> {
  onInputChange?: (evt: FormEvent<HTMLInputElement>) => void;
}

export const ExpandoCombobox = forwardRef(function ExpandoCombobox<
  Item = string,
  S extends SelectionStrategy = "default"
>(
  {
    className: classNameProp,
    InputProps: InputPropsProp = NO_INPUT_PROPS,
    ListProps: ListPropsProp,
    onInputChange,
    onSelectionChange,
    selectionStrategy,
    style,
    value = "",
    ...props
  }: ExpandoComboboxProps<Item, S>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [text, setText] = useState(value);
  const { itemToString = defaultToString } = props;
  const initialValue = useRef(value);

  const itemsToString = useCallback(
    (items: Item[]) => {
      const [first, ...rest] = items;
      if (rest.length) {
        return `${itemToString(first)} + ${rest.length}`;
      } else {
        return itemToString(first);
      }
    },
    [itemToString]
  );

  const handleInputChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const { value } = evt.target as HTMLInputElement;
      console.log(`onInputChange ${value}`);
      setText(value);
      onInputChange?.(evt);
    },
    [onInputChange]
  );

  const handleSetSelectedText = useCallback((text: string) => {
    setText(text);
  }, []);

  const [InputProps, ListProps] = useMemo<
    // [ComboBoxProps["InputProps"], ComboBoxProps["ListProps"]]
    [ComboBoxProps["InputProps"], any]
  >(() => {
    const { inputProps, ...restInputProps } = InputPropsProp;
    return [
      {
        ...restInputProps,
        className: `${classBase}-Input`,
        endAdornment: null,
        inputProps: {
          ...inputProps,
          autoComplete: "off",
          onInput: handleInputChange,
        },
      },
      {
        ...ListPropsProp,
        className: cx("vuuMenuList", ListPropsProp?.className),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        "data-mode": "light",
        displayedItemCount: 10,
        itemHeight: 22,
        maxWidth: 300,
        minWidth: 80,
        width: "content-width",
      },
    ];
  }, [InputPropsProp, handleInputChange, ListPropsProp]);

  const handleSelectionChange = useCallback(
    (evt, selected) => {
      if (Array.isArray(selected)) {
        (onSelectionChange as MultiSelectionHandler<Item>)?.(
          null,
          selected as Item[]
        );
      } else if (selected) {
        setText(itemToString(selected));
        (onSelectionChange as SingleSelectionHandler<Item>)?.(
          null,
          selected as Item
        );
      }
    },
    [itemToString, onSelectionChange]
  );

  const popupProps = {
    minWidth: "fit-content",
  };

  return props.source?.length === 0 ? null : (
    <div
      className={cx(classBase, classNameProp)}
      data-text={text}
      ref={forwardedRef}
      style={style}
    >
      <ComboBox<Item, S>
        {...props}
        PopupProps={popupProps}
        defaultValue={initialValue.current}
        fullWidth
        ListProps={ListProps}
        InputProps={InputProps}
        itemsToString={itemsToString}
        onSelectionChange={handleSelectionChange}
        onSetSelectedText={handleSetSelectedText}
        selectionStrategy={selectionStrategy}
      />
    </div>
  );
}) as <Item, S extends SelectionStrategy = "default">(
  props: ExpandoComboboxProps<Item, S> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<ExpandoComboboxProps<Item, S>>;
