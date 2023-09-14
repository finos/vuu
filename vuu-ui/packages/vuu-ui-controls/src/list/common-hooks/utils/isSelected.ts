import { CollectionItem } from "../../../common-hooks/collectionTypes";

export function isSelected<Item>(
  selected: string | string[] | null,
  item: CollectionItem<Item>
): boolean {
  const isSelected = Array.isArray(selected)
    ? selected.includes(item.id)
    : selected === item.id;
  return isSelected;
}
