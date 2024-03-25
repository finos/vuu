import { itemToString as defaultToString } from "@finos/vuu-utils";
import {
  ComboBox,
  ComboBoxProps,
  MultiSelectionHandler,
  SelectionStrategy,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";
import cx from "clsx";
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
> extends Omit<ComboBoxProps<Item, S>, "itemToString" | "value"> {
  itemToString?: (item: unknown) => string;
  onInputChange?: (evt: FormEvent<HTMLInputElement>) => void;
  value?: string | string[];
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
    source,
    style,
    title,
    value = "",
    ...props
  }: ExpandoComboboxProps<Item, S>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [text, setText] = useState(value);
  const { itemToString = defaultToString } = props;
  const initialValue = useRef(value);

  const itemsToString = useCallback<<I = Item>(items: I[]) => string>(
    (items) => {
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
      setText(value);
      onInputChange?.(evt);
    },
    [onInputChange]
  );

  const handleSetSelectedText = useCallback((text: string) => {
    setText(text);
  }, []);

  const [InputProps, ListProps] = useMemo<
    [
      ComboBoxProps["InputProps"],
      Omit<ComboBoxProps["ListProps"], "defaultSelected">
    ]
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
    (_, selected) => {
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSelected = (): any => {
    if (initialValue.current === undefined) {
      return undefined;
    } else if (Array.isArray(initialValue.current)) {
      return source?.filter((item) =>
        initialValue.current.includes(itemToString(item))
      );
    } else {
      return source?.find(
        (item) => itemToString(item) === initialValue.current
      );
    }
  };

  const popupProps = {
    minWidth: "fit-content",
  };
  return (
    <div
      className={cx(classBase, classNameProp)}
      data-text={text}
      ref={forwardedRef}
      style={style}
    >
      <ComboBox<Item, S>
        {...props}
        PopupProps={popupProps}
        // allowEnterCommitsText
        className="vuuEmbedded"
        defaultSelected={getSelected()}
        defaultValue={
          Array.isArray(initialValue.current)
            ? itemsToString<string>(initialValue.current)
            : initialValue.current
        }
        fullWidth
        ListProps={ListProps}
        InputProps={InputProps}
        itemsToString={itemsToString}
        onSelectionChange={handleSelectionChange}
        onSetSelectedText={handleSetSelectedText}
        selectionStrategy={selectionStrategy}
        source={source}
      />
    </div>
  );
}) as <Item, S extends SelectionStrategy = "default">(
  props: ExpandoComboboxProps<Item, S> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<ExpandoComboboxProps<Item, S>>;
