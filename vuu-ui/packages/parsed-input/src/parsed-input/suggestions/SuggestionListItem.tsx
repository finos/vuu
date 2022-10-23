import { ListItem, ListItemProps } from "@heswell/uitk-lab";
import { SuggestionItem } from "@vuu-ui/datagrid-parsers";
import cx from "classnames";

import "./SuggestionListItem.css";

const classBase = "vuuSuggestionListItem";

export const itemToString = (item: SuggestionItem) => {
  if (item.value === "]") {
    return "End of list items";
  } else {
    return item.value;
  }
};

function formatDisplayValue(displayValue: string) {
  if (Array.isArray(displayValue)) {
    return displayValue.map((value, i) => (
      <span key={i} className={`${classBase}-listCol`}>
        {value}
      </span>
    ));
  } else if (displayValue === "EOF") {
    return <div>ENTER to submit filter</div>;
  } else {
    return displayValue;
  }
}

export const SuggestionListItem = (props: ListItemProps<SuggestionItem>) => {
  const { item: suggestion } = props;
  if (suggestion === undefined) {
    throw Error("SuggestionListItem, no suggestion provided to ListItem");
  }
  const { id, label, value = label, isIllustration } = suggestion;
  const displayValue = value ?? label;
  return (
    <ListItem
      {...props}
      className={cx(props.className, {
        [`${classBase}-illustration`]: isIllustration,
        [`${classBase}-commit`]: value === "EOF",
        [`${classBase}-close-list`]: value === "]",
      })}
      id={id}
      key={id}>
      {formatDisplayValue(displayValue)}
    </ListItem>
  );
};
