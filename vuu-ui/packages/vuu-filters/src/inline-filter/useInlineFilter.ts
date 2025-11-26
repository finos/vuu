import { useEditableCell, useHeaderProps } from "@vuu-ui/vuu-table";

export const useInlineFilter = () => {
  const { columns = [], virtualColSpan = 0 } = useHeaderProps();
  const onKeyDown = useEditableCell();

  return {
    columns,
    onKeyDown,
    virtualColSpan,
  };
};
