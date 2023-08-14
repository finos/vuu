import { itemToString as defaultToString } from "@finos/vuu-utils";
import { ComboBox, ComboBoxProps } from "@finos/vuu-ui-controls";
import cx from "classnames";
import {
  ChangeEvent,
  FormEvent,
  ForwardedRef,
  forwardRef,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import "./ExpandoCombobox.css";

const classBase = "vuuExpandoCombobox";

const NO_INPUT_PROPS = {};

export interface ExpandoComboboxProps<Item = string>
  extends ComboBoxProps<Item> {
  allowMultipleSelection?: boolean;
  onInputChange?: (evt: FormEvent<HTMLInputElement>) => void;
}

export const ExpandoCombobox = forwardRef(function ExpandoCombobox<
  Item = string
>(
  {
    allowMultipleSelection = false,
    className: classNameProp,
    InputProps: InputPropsProp = NO_INPUT_PROPS,
    ListProps: ListPropsProp,
    onInputChange,
    onSelectionChange,
    value = "",
    ...props
  }: ExpandoComboboxProps<Item>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [text, setText] = useState(value);
  const { itemToString = defaultToString } = props;
  const initialValue = useRef(value);

  const handleInputChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const { value } = evt.target as HTMLInputElement;
      setText(value);
      onInputChange?.(evt);
    },
    [onInputChange]
  );

  const [InputProps, ListProps] = useMemo<
    [ComboBoxProps["InputProps"], any]
  >(() => {
    const { inputProps, ...restInputProps } = InputPropsProp;
    return [
      {
        ...restInputProps,
        className: `${classBase}-Input`,
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
        minWidth: 100,
        width: "auto",
      },
    ];
  }, [InputPropsProp, handleInputChange, ListPropsProp]);

  const handleSelectionChange = useCallback(
    (evt: SyntheticEvent, item: Item | null) => {
      const selectedValue = item === null ? "" : itemToString(item);
      setText(selectedValue);
      onSelectionChange?.(evt, item);
    },
    [itemToString, onSelectionChange]
  );

  const [multiSelectText, setMultiSelectText] = useState<string>("");
  const [selected, setSelected] = useState<any[]>([]);
  const handleMultiSelectChange = useCallback((evt, selected) => {
    setSelected(selected);
  }, []);
  const handleMultiSelectInputChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const { value } = evt.target as HTMLInputElement;
      setMultiSelectText(value);
    },
    []
  );

  return (
    <div
      className={cx(classBase, classNameProp)}
      data-text={text}
      ref={forwardedRef}
    >
      {allowMultipleSelection ? (
        <ComboBox // The new ComboBox isn't multi-selectable
          multiSelect
          source={props.source || []}
          onChange={handleMultiSelectChange}
          onInputChange={handleMultiSelectInputChange}
          inputValue={multiSelectText}
          itemToString={props.itemToString}
          selectedItem={selected}
          // InputProps={{
          //   inputProps: { autoComplete: "off" },
          // }}
          ListProps={{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            "data-mode": "light",
            displayedItemCount: 15,
            itemHeight: 20,
            width: "auto",
          }}
          // delimiter={","}
          // allowFreeText
        />
      ) : (
        <ComboBox<Item>
          {...props}
          defaultValue={initialValue.current}
          // ListItem={() => <span>{"blah"}</span>}
          ListProps={ListProps}
          InputProps={InputProps}
          onSelectionChange={handleSelectionChange}
        />
      )}
    </div>
  );
}) as <Item>(
  props: ExpandoComboboxProps<Item> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<ExpandoComboboxProps<Item>>;
