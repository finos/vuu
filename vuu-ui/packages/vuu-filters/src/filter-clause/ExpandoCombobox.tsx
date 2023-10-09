import { itemToString as defaultToString } from "@finos/vuu-utils";
import {
  ComboBox,
  ComboBoxProps,
  SelectionChangeHandler,
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
    style,
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

  console.log({ style });
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
        minWidth: 100,
        width: "auto",
      },
    ];
  }, [InputPropsProp, handleInputChange, ListPropsProp]);

  const handleSelectionChange = useCallback<SelectionChangeHandler<Item>>(
    (evt, selected) => {
      if (Array.isArray(selected)) {
        if (selected.length === 1) {
          const selectedValue = itemToString(selected[0]);
          setText(selectedValue);
          onSelectionChange?.(evt, selected);
        }
      }
    },
    [itemToString, onSelectionChange]
  );

  const [selected, setSelected] = useState<Item[]>([]);
  const handleMultiSelectChange = useCallback((evt, selected) => {
    console.log(`handle Multi Sellect change`);
    setSelected(selected);
  }, []);

  return (
    <div
      className={cx(classBase, classNameProp)}
      data-text={text}
      ref={forwardedRef}
      style={style}
    >
      {allowMultipleSelection ? (
        <ComboBox<Item>
          {...props}
          defaultValue={initialValue.current}
          ListProps={ListProps}
          InputProps={InputProps}
          onSelectionChange={handleMultiSelectChange}
          selectionStrategy="multiple"
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
