import { ListBox, ListBoxProps, Option, OptionProps } from "@salt-ds/core";
import { useSortable } from "@dnd-kit/react/sortable";
import { DragDropProvider } from "@dnd-kit/react";
import { useCallback, useRef } from "react";

export const SortableOption = ({
  id,
  index,
  value,
  ...optionProps
}: OptionProps & { id: string; index: number }) => {
  const { ref } = useSortable({ id, index });
  return <Option {...optionProps} id={id} ref={ref} value={value} />;
};

export const SortableList = ({
  children,
  onReorderListItems,
  ...listBoxProps
}: ListBoxProps & {
  onReorderListItems?: (listItems: unknown[]) => void;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      const listItems = listRef.current?.querySelectorAll(".saltOption");
      if (listItems) {
        const items = Array.from(listItems).map(({ id }) => id);
        onReorderListItems?.(items);
      }
    }, 300);
  }, [onReorderListItems]);

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <ListBox {...listBoxProps} ref={listRef}>
        {children}
      </ListBox>
    </DragDropProvider>
  );
};
