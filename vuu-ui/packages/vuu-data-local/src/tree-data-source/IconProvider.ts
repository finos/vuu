import { DataRow } from "@vuu-ui/vuu-table-types";

export class IconProvider {
  #iconMap: Record<string, string> = {};
  getIcon = (dataRow: DataRow) => {
    const key = dataRow.key;
    return this.#iconMap[key];
  };
  setIcon(key: string, icon: string) {
    this.#iconMap[key] = icon;
  }
}
