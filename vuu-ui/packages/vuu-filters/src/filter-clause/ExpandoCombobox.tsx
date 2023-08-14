import { itemToString as defaultToString } from "@finos/vuu-utils";
import { ComboBox, ComboBoxDeprecated, ComboBoxProps } from "@salt-ds/lab";
import cx from "classnames";
import { useThemeAttributes } from "@finos/vuu-shell";
import {
  ChangeEvent,
  FormEvent,
  ForwardedRef,
  forwardRef,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";

import "./ExpandoCombobox.css";

const classBase = "vuuExpandoCombobox";

export interface ExpandoComboboxProps<Item = string>
  extends ComboBoxProps<Item> {
  allowMultipleSelection?: boolean;
}

export const ExpandoCombobox = forwardRef(function ExpandoCombobox<
  Item = string
>(
  {
    allowMultipleSelection = false,
    className: classNameProp,
    onSelectionChange,
    ...props
  }: ExpandoComboboxProps<Item>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const [themeClass, densityClass] = useThemeAttributes();
  const [text, setText] = useState(props.value ?? "");
  const { itemToString = defaultToString } = props;

  const handleInputChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    const { value } = evt.target as HTMLInputElement;
    setText(value);
  }, []);

  const InputProps = useMemo(
    () => ({
      className: `${classBase}-Input`,
      highlightOnFocus: true,
      inputProps: {
        autoComplete: "off",
        onInput: handleInputChange,
      },
    }),
    [handleInputChange]
  );

  const handleSelectionChange = useCallback(
    (evt: SyntheticEvent, item: Item | null) => {
      console.log(`selection changed`, {
        evt,
        item,
      });
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
        <ComboBoxDeprecated // The new ComboBox isn't multi-selectable
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
            className: cx(themeClass, densityClass),
            // borderless: true,
            // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // // @ts-ignore
            "data-mode": "light",
            displayedItemCount: 15,
            itemHeight: 20,
          }}
          // delimiter={","}
          // allowFreeText
        />
      ) : (
        <ComboBox<Item>
          {...props}
          value={text}
          ListProps={{
            className: cx(themeClass, densityClass),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            "data-mode": "light",
            displayedItemCount: 10,
            itemHeight: 20,
            minWidth: 100,
          }}
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
