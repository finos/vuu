import { forwardRef } from "react";
import cx from "classnames";
import { List, ListItem, ListItemProps, ListProps } from "@heswell/uitk-lab";
import { useSuggestionList } from "./useSuggestionList";

import "./SuggestionList.css";
import { SuggestionItem } from "@vuu-ui/datagrid-parsers";

// for now ...
const classBase = "hwSelectionList";

const NO_SUGGESTIONS = [];

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

const SuggestionListItem = (props: ListItemProps<SuggestionItem>) => {
  const { item: suggestion } = props;
  if (suggestion === undefined) {
    throw Error("SuggestionListItem, no suggestion provided to LIstItem");
  }
  console.log({ suggestion });
  const {
    id,
    label,
    value = label,
    displayValue = value,
    isIllustration,
  } = suggestion;
  return (
    <ListItem
      className={cx({
        // [`${classBase}-selected`]: selected.includes(i),
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

export const SuggestionList = forwardRef(function SuggestionList(
  props: ListProps,
  ref
) {
  // useSuggestionList({
  //   selected,
  //   selectionStrategy,
  //   // setHighlightedIdx,
  //   source
  // });

  const { onCommit, ...rest } = props;

  const setHighlightedIdx = (inx) => {
    console.log({ inx });
  };

  return (
    <List<SuggestionItem> ListItem={SuggestionListItem} ref={ref} {...rest}>
      // onHighlight={setHighlightedIdx}
      {/* {source.length > 0
        ? source.map(({ id, label, value = label, displayValue = value, isIllustration }) => (
            <div
              className={cx({
                // [`${classBase}-selected`]: selected.includes(i),
                [`${classBase}-illustration`]: isIllustration,
                [`${classBase}-commit`]: value === 'EOF',
                [`${classBase}-close-list`]: value === ']'
              })}
              id={id}
              key={id}>
              {formatDisplayValue(displayValue)}
            </div>
          ))
        : NO_SUGGESTIONS} */}
    </List>
  );
});
