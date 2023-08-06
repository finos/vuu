import { itemToString as defaultToString } from "@finos/vuu-utils";
import { ComboBox, ComboBoxProps, SelectionStrategy } from "@salt-ds/lab";
import cx from "classnames";
import { useThemeAttributes } from "@finos/vuu-shell";
import {
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

export const ExpandoCombobox = forwardRef(function ExpandoCombobox<
  Item = string
>(
  {
    className: classNameProp,
    onSelectionChange,
    ...props
  }: ComboBoxProps<Item>,
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
      const selectedValue = item === null ? "" : itemToString(item);
      setText(selectedValue);
      onSelectionChange?.(evt, item);
    },
    [itemToString, onSelectionChange]
  );

  return (
    <div
      className={cx(classBase, classNameProp)}
      data-text={text}
      ref={forwardedRef}
    >
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
    </div>
  );
}) as <Item, Selection extends SelectionStrategy = "default">(
  props: ComboBoxProps<Item, Selection> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<ComboBoxProps<Item, Selection>>;
