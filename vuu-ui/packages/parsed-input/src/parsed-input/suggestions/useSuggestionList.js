import { useEffect, useRef } from 'react';

export const useSuggestionList = ({ selected, selectionStrategy, setHighlightedIdx, source }) => {
  // const [source, setSource] = useState(sourceProp);
  const prevSelected = useRef(selected);
  const isMultiSelect = selectionStrategy === 'checkbox-only';

  useEffect(() => {
    const { current: wasSelected } = prevSelected;
    if (isMultiSelect) {
      if (wasSelected.length === 0 && selected.length > 0) {
        // setHighlightedIdx(selected.length);
      } else if (wasSelected.length > 0 && selected.length > 0) {
        // setHighlightedIdx(selected.length);
      }
    }
    prevSelected.current = selected;
  }, [isMultiSelect, selected, setHighlightedIdx]);

  // useEffect(() => {
  //   // setSource(sourceProp);
  //   setHighlightedIdx(0);
  // }, [setHighlightedIdx, source]);

  // return source;
};
