import { PickerSelectionType } from "../types";

export interface BasePickerInputProps<T extends PickerSelectionType> {
  onChange: (selected: T) => void;
  value?: T;
  className?: string;
}
