import {
  type DataItemEditControlProps,
  getDataItemEditControl,
} from "@vuu-ui/vuu-data-editing";
import {
  ToggleFilter,
  type ToggleFilterValue,
} from "../toggle-filter/ToggleFilter";

/**
 * variant can be used to provide a rendering hint to the filter control rendered.
 * 'toggle' for A ToggleButtonGroup, only suitable for up to 3 value choices
 * 'search' to render a search icon and require at least one character to be entered.
 * 'pick' to show a dropdown list, even before any text is entered, best for smaller lists
 */
export type FilterControlVariant = "search" | "pick" | "toggle";

export interface FilterControlProps
  extends Omit<DataItemEditControlProps, "purpose" | "variant"> {
  /**
   * Optional labels, only used with 'toggle' variant. If provided, must
   * have same number of items as values. Defaults to values.
   */
  labels?: string[];
  /**
   * Where provided, only these values will be offered as suggestions.
   * They will be validated against server with Typeahead service, so
   * unavailable options are not offered.
   * Recommended for toggle filters, not usually necessary for other
   * filter variants. Boolean values are supported for toggle filters on
   * boolean columns, where values default to [true, false]. A toggle filter
   * on a char column requires values, which are not validated.
   */
  values?: ToggleFilterValue[];
  variant?: FilterControlVariant;
}

const BOOLEAN_TOGGLE_VALUES: ToggleFilterValue[] = [true, false];

/**
 * The control used to enter a filter value. A 'toggle' variant renders a
 * ToggleFilter, everything else is delegated to getDataItemEditControl, so a
 * value is entered with the same control in a filter as in a form.
 */
export const getFilterControl = ({
  labels,
  values,
  variant,
  ...props
}: FilterControlProps) => {
  const { InputProps, className, dataDescriptor, onCommit, table } = props;
  if (variant === "toggle") {
    const value = InputProps?.inputProps?.value ?? "all";
    if (
      dataDescriptor.serverDataType === "boolean" ||
      (dataDescriptor.serverDataType === "char" && values?.length)
    ) {
      return (
        <ToggleFilter
          className={className}
          column={dataDescriptor.name}
          data-edit-control
          // typeahead only supports string columns
          disableTypeahead
          labels={labels}
          onCommit={onCommit}
          table={table}
          values={values?.length ? values : BOOLEAN_TOGGLE_VALUES}
          value={value}
        />
      );
    } else if (
      dataDescriptor.serverDataType === "string" &&
      table &&
      values?.length
    ) {
      return (
        <ToggleFilter
          className={className}
          column={dataDescriptor.name}
          data-edit-control
          labels={labels}
          onCommit={onCommit}
          table={table}
          values={values}
          value={value}
        />
      );
    }
  }
  return getDataItemEditControl({
    ...props,
    purpose: "filter",
    variant: variant === "toggle" ? undefined : variant,
  });
};
