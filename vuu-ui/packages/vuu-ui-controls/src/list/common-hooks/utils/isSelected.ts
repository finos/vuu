import { CollectionItem } from "../../../common-hooks/collectionTypes";

export function isSelected<Item>(
  selectedId: string | string[] | null,
  item: CollectionItem<Item>
): boolean {
  const isSelected = Array.isArray(selectedId)
    ? selectedId.includes(item.id)
    : selectedId === item.id;
  return isSelected;
}
