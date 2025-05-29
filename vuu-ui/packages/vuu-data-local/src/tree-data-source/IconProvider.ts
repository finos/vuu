import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { metadataKeys } from "@vuu-ui/vuu-utils";

const { KEY } = metadataKeys;

export class IconProvider {
  #iconMap: Record<string, string> = {};
  getIcon = (row: DataSourceRow) => {
    const key = row[KEY];
    return this.#iconMap[key];
  };
  setIcon(key: string, icon: string) {
    this.#iconMap[key] = icon;
  }
}
